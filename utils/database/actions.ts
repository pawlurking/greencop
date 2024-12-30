import {db} from './dbConfig';
import { NotificationTable, ReportTable, RewardTable, TransactionTable, UserTable, CollectedWasteTable } from './schema';
import {eq, sql, and, desc} from 'drizzle-orm';

export async function saveReward(userID: number, amount: number) {
  try {
    const [reward] = await db
      .insert(RewardTable)
      .values({
        userID,
        rewardName: 'Waste Collection Reward',
        rewardClaimInfo: 'Points earned from waste collection',
        karmaScore: amount,
        isAvailable: true,
      })
      .returning()
      .execute();
    
    // Create a transaction for this reward
    await createTransaction(userID, 'earned_collect', amount, 'Points earned for collecting waste');

    return reward;
  } catch (error) {
    console.error("Error saving reward:", error);
    throw error;
  }
}


export async function updateTaskStatus(reportId: number, newStatus: string, collectorId?: number) {
  try {
    const updateData: any = { status: newStatus };
    if (collectorId !== undefined) {
      updateData.collectorId = collectorId;
    }
    const [updatedReport] = await db
      .update(ReportTable)
      .set(updateData)
      .where(eq(ReportTable.id, reportId))
      .returning()
      .execute();
    return updatedReport;
  } catch (error) {
    console.error("Error updating task status:", error);
    throw error;
  }
}

export async function getAvailableRewards(userID: number) {
  try {
    console.log('Fetching available rewards for user:', userID);

    
    // Get user's total points
    const userTransactions = await getRewardTransactions(userID) as any;


    const userPoints = userTransactions.reduce((total:any, transaction:any) => {
      return transaction.type.startsWith('earned') ? total + transaction.amount : total - transaction.amount;
    }, 0);

    console.log('User total points:', userPoints);

    // Get available rewards from the database
    const dbRewards = await db
      .select({
        id: RewardTable.id,
        name: RewardTable.rewardName,
        cost: RewardTable.karmaScore,
        description: RewardTable.rewardDescription,
        collectionInfo: RewardTable.rewardClaimInfo,
      })
      .from(RewardTable)
      .where(eq(RewardTable.isAvailable, true))
      .execute();

    console.log('Rewards from database:', dbRewards);

    // Combine user points and database rewards
    const allRewards = [
      {
        id: 0, // Use a special ID for user's points
        name: "Your Points",
        cost: userPoints,
        description: "Redeem your earned points",
        collectionInfo: "Points earned from reporting and collecting waste"
      },
      ...dbRewards
    ];

    console.log('All available rewards:', allRewards);
    return allRewards;
  } catch (error) {
    console.error("Error fetching available rewards:", error);
    return [];
  }
};


export async function createUser(email:string, name:string) {
  try {
    const [user] = await db.insert(UserTable).values({email,name}).returning().execute();
    return user;

  } catch (error) {
    console.error('Error creating user', error);
    return null;
  }
}

export async function getUserByEmail(email:string){
  try {
    const [user] = await db.select().from(UserTable).where(eq(UserTable.email, email)).execute();
    return user;

  } catch (error) {
    console.error('Error fetching user by email', error);
    return null;
  }
}

export async function getUnreadNotifications(userID: number) {
  try {
    return await db.select().from(NotificationTable).where(and(eq(NotificationTable.userID, userID), eq(NotificationTable.isRead, false))).execute();

  } catch (error) {
    console.error('Error fetching unread notifications', error);
    return null;
  }
}

export async function getRewardTransactions(userID:number){
  try {
    const transactions = await db.select({
      id:TransactionTable.id,
      type: TransactionTable.type,
      amount: TransactionTable.amount,
      description: TransactionTable.description,
      date: TransactionTable.date,
    }).from(TransactionTable).where(eq(TransactionTable.userID, userID)).orderBy(desc(TransactionTable.date)).limit(10).execute();

    const formattedTransactions = transactions.map(t=>({
      ...t,
      date: t.date.toISOString().split('T')[0],
    }))

    return formattedTransactions;

  } catch (error) {
    console.error('Error fetching reward transactions', error);
    return null;
  }
}

export async function getUserBalance(userID:number):Promise<number>{
  const transactions = await getRewardTransactions(userID) || [];

  if (!transactions) {
    return 0;
  }

  const balance = transactions.reduce((acc:number, transaction:any)=>{
    return transaction.type.startsWith('earned') ? acc + transaction.amount : acc - transaction.amount;
  }, 0)

  return Math.max(balance, 0);

}

export async function markNotificationAsRead(notificationID:number){

  try {
    await db.update(NotificationTable).set({isRead:true}).where(eq(NotificationTable.id, notificationID)).execute();
  } catch (error) {
    console.error('Error marking notification as read', error);
    return null;
  }
  
}

export async function updateRewardPoints(userID: number, pointsToAdd:number) {
  try {
    const [updatedReward] = await db.update(RewardTable).set({
      karmaScore: sql`${RewardTable.karmaScore} + ${pointsToAdd}`, 
      updatedAt: new Date()}).where(eq(ReportTable.userID, userID)).returning().execute();
    return updatedReward;

  } catch (error) {
    console.error("Error in updating reward points", error);
    return null;

  }
};

export async function createTransaction(
  userID: number, 
  type: 'earned_report' | 'earned_collect' | 'redeemed', amount: number, description: string
) {
  try {
    const [transaction] = await db
      .insert(TransactionTable)
      .values({ userID, type, amount, description })
      .returning()
      .execute();
    return transaction;
  } catch (error) {
    console.error("Error creating transaction:", error);
    throw error;
  }
};

export async function createNotification(userID: number, message: string, type: string) {
  try {
    const [notification] = await db
      .insert(NotificationTable)
      .values({ userID, message, type })
      .returning()
      .execute();
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    return null;
  }
};


export async function createReport(
  userID: number,
  location: string,
  wasteType: string,
  amount: string,
  // amount: number,
  imageURL?:string,
  verificationResult?:any

) {

  try {
    const [report] = await db.insert(ReportTable).values({
      userID,
      location,
      wasteType,
      amount,
      imageURL,
      inferenceResult:verificationResult,
      status:'pending',
    }).returning().execute();

    // game rule: earn 10 points for each reporting time
    const pointsEarned = 10;

    // update reward points
    await updateRewardPoints(userID, pointsEarned);
    // create transaction
    await createTransaction(userID, 'earned_report', pointsEarned, 'Points earned for garbage reporting')
    // create notification
    await createNotification(userID, `You've earned ${pointsEarned} points for garbage reporting`, 'reward');
    return report;

  } catch (error) {
    console.error(`Error in creating report`, error);
    return null;
  }

};

export async function getRecentReports(limit: number = 10) {
  try {
    const reports = await db
      .select()
      .from(ReportTable)
      .orderBy(desc(ReportTable.createdAt))
      .limit(limit)
      .execute();
    return reports;
  } catch (error) {
    console.error("Error fetching recent reports:", error);
    return [];
  }
};

export async function getWasteCollectionTasks(limit: number = 20) {
  try {
    const tasks = await db
      .select({
        id: ReportTable.id,
        location: ReportTable.location,
        wasteType: ReportTable.wasteType,
        amount: ReportTable.amount,
        status: ReportTable.status,
        date: ReportTable.createdAt,
        collectorId: ReportTable.collectorID,
      })
      .from(ReportTable)
      .limit(limit)
      .execute();

    return tasks.map(task => ({
      ...task,
      date: task.date.toISOString().split('T')[0], // Format date as YYYY-MM-DD
    }));
  } catch (error) {
    console.error("Error fetching waste collection tasks:", error);
    return [];
  }
}

export async function saveCollectedWaste(reportId: number, collectorId: number, verificationResult: any) {
  try {
    const [collectedWaste] = await db.insert(CollectedWasteTable)
      .values({
        reportID:reportId,
        collectorID:collectorId,
        collectionDate: new Date(),
        status: 'verified',
      })
      .returning()
      .execute();
    return collectedWaste;
  } catch (error) {
    console.error("Error saving collected waste:", error);
    throw error;
  }
}

