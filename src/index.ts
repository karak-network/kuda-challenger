import { kudaContract } from './contracts/contract';
import { Task } from './interfaces';
import { HEARTBEAT, MILLISECONDS_IN_SECONDS } from './utils/constants';
import { env } from './utils/envConfig';
import { pino } from 'pino';
import { Address, decodeAbiParameters } from 'viem';
import { uuidToHex } from './utils/uuid';
import { PrismaClient } from '@prisma/client';
import { isInvalid4844Commitment } from './eip4844';
import { isInvalidCelestiaCommitment } from './celestia';

export const logger = pino({ name: 'server start' });
const prisma = new PrismaClient();

enum DaLayer {
  Celestia = 0,
  EIP4844 = 1,
}

const main = async () => {
  setInterval(async () => {
    try {
      await runChallenger();
    } catch (error) {
      logger.error(`index :: main :: error: ${error}`);
    }
  }, HEARTBEAT);
};

const runChallenger = async () => {
  const tasks = await getTasksInChallengePeriod();
  const newTasks = await filterNewTasks(tasks);
  const submissionPeriodOverTasks = newTasks.filter((task) => {
    return task.operatorTaskSubmissionTime + 2 < Date.now() / MILLISECONDS_IN_SECONDS;
  });
  const tasksByDescendingTime = sortTasksByOperatorTaskStartTime(submissionPeriodOverTasks);
  const [tasksWithNoCommitmentAndNoChallenge, tasksWithCommitmentButNoChallenge] =
    await getTasksWithNoCommitmentAndNoChallenge(tasksByDescendingTime);
  createNoOpChallenges(tasksWithNoCommitmentAndNoChallenge);
  commitmentValidityChallenge(tasksWithCommitmentButNoChallenge);
  addTasks(newTasks);
};

async function addTasks(tasks: Task[]) {
  tasks.map(async (task) => {
    await prisma.task.create({
      data: {
        taskId: task.taskId,
        acceptableDaLayers: task.acceptableDaLayers,
        status: task.status,
        clientAddress: task.clientAddress,
        rewardToken: task.rewardToken,
        rewardAmount: task.rewardAmount.toString(),
        reason: task.reason,
        winnerOperator: task.winnerOperator,
        daLayer: task.daLayer,
        commitment: task.commitment,
        operatorTaskSubmissionTime: Number(task.operatorTaskSubmissionTime),
        nameSpace: task.nameSpace,
        aggregatorSignature: task.aggregatorSignature,
      },
    });
  });
}

async function taskIdExists(taskId: string): Promise<boolean> {
  const task = await prisma.task.findUnique({
    where: { taskId },
  });
  return task !== null;
}

async function filterNewTasks(tasks: Task[]): Promise<Task[]> {
  const existenceChecks = await Promise.all(
    tasks.map(async (task) => ({
      task,
      exists: await taskIdExists(task.taskId),
    }))
  );

  return existenceChecks.filter((check) => !check.exists).map((check) => check.task);
}

const sortTasksByOperatorTaskStartTime = (tasks: Task[]): Task[] => {
  return tasks.sort((a, b) => {
    return b.operatorTaskSubmissionTime - a.operatorTaskSubmissionTime;
  });
};

const getTasksInChallengePeriod = async (): Promise<Task[]> => {
  const response = await fetch(env.AGGREGATOR_URL + '/aggregator/getTasksInChallengePeriod');
  if (!response.ok) {
    logger.error(`index :: getTasksInChallengePeriod :: error: ${response.statusText}`);
  }
  return (await response.json())['responseObject'] as Task[];
};

const getTasksWithNoCommitmentAndNoChallenge = async (tasks: Task[]): Promise<[Task[], Task[]]> => {
  const tasksWithNoChallenge = (
    await Promise.all(
      tasks.map(async (task) => {
        const challengeCreated = (await kudaContract.read.challengeData([uuidToHex(task.taskId)])) as [
          Address,
          Address,
          bigint,
          number,
          boolean,
        ];
        return { challengeCreated: challengeCreated[2] != 0n, task: task };
      })
    )
  )
    .filter((task) => task.challengeCreated == false)
    .map((task) => task.task);
  const tasksWithNoCommitmentAndNoChallenge = (
    await Promise.all(
      tasksWithNoChallenge.map(async (task) => {
        const commitmentOnChain = (await kudaContract.read.submittedReceipt([uuidToHex(task.taskId)]))[3];
        return { commitmentOnChain: commitmentOnChain !== 0n, task: task };
      })
    )
  )
    .filter((task) => task.commitmentOnChain == false)
    .map((task) => task.task);

  const tasksWithCommitmentButNoChallenge = tasksWithNoChallenge.filter(
    (task) => !tasksWithNoCommitmentAndNoChallenge.some((tsk) => tsk == task)
  );
  return [tasksWithNoCommitmentAndNoChallenge, tasksWithCommitmentButNoChallenge];
};

const commitmentValidityChallenge = async (tasks: Task[]) => {
  for (const task of tasks) {
    const receipt = await kudaContract.read.submittedReceipt([uuidToHex(task.taskId)]);
    const commitmentDaLayer = receipt[0] as DaLayer;
    const bond = await kudaContract.read.CHALLENGE_BOND();
    switch (commitmentDaLayer) {
      case DaLayer.Celestia: {
        //celestia
        const height = Number(
          decodeAbiParameters(
            [
              { name: 'namespace', type: 'bytes29' },
              { name: 'height', type: 'uint64' },
            ],
            receipt[1]
          )[1]
        );
        logger.info(`taskId : ${task.taskId} :: challenge :: height : ${height}`);
        if (await isInvalidCelestiaCommitment(task.nameSpace!, height, receipt[2])) {
          await kudaContract.write.createChallenge(
            [
              task.winnerOperator,
              uuidToHex(task.taskId),
              task.aggregatorSignature,
              task.commitment,
              commitmentDaLayer,
              BigInt(task.operatorTaskSubmissionTime),
              task.clientAddress,
              task.rewardToken,
              task.rewardAmount,
            ],
            { value: bond }
          );
          logger.info(`challenge created`);
        }
        break;
      }
      case DaLayer.EIP4844: {
        const context = decodeAbiParameters([{ name: 'slot', type: 'uint64' }], receipt[1]);
        const commitment = receipt[2];
        const slot = context[0];

        // 4844
        if (await isInvalid4844Commitment(slot, commitment)) {
          await kudaContract.write.createChallenge(
            [
              task.winnerOperator,
              uuidToHex(task.taskId),
              task.aggregatorSignature,
              task.commitment,
              commitmentDaLayer,
              BigInt(task.operatorTaskSubmissionTime),
              task.clientAddress,
              task.rewardToken,
              task.rewardAmount,
            ],
            { value: bond }
          );
          logger.info(`challenge created`);
        }
        break;
      }
    }
  }
};

const createNoOpChallenges = async (tasks: Task[]) => {
  for (const task of tasks) {
    try {
      await kudaContract.write.createChallenge([
        task.winnerOperator,
        uuidToHex(task.taskId),
        task.aggregatorSignature,
        task.commitment,
        task.daLayer == 'Celestia' ? 0 : 1,
        BigInt(task.operatorTaskSubmissionTime),
        task.clientAddress,
        task.rewardToken,
        task.rewardAmount,
      ]);
      logger.info('challenge created: NoOp');
    } catch (error) {
      logger.error(`challenger :: createNoOpChallenge :: failed : ${error}`);
    }
  }
};

main();
