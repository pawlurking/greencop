import {integer, varchar, pgTable, serial, text, timestamp, jsonb, boolean} from 'drizzle-orm/pg-core';

// this schema is going to be the user table

export const UserTable = pgTable('users', {

  id: serial('id').primaryKey(),
  email: varchar('email', {length: 255}).notNull().unique(),
  name: varchar('name', {length: 255}).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),


})

// this scheme defines report table
export const ReportTable = pgTable("reports", {
  id: serial('id').primaryKey(),
  // we need userID inside report table to know which user has made the report so that we can give rewards to that user
  userID: integer("user_id").references(() => UserTable.id).notNull(),
  // to specify the location that the garbage is reported from. For now, it should be in text because we focus on text-based location tracking. However, in the future, it should allows user to insert location identifier that is unique matched to that very location on the map because new roads, untitled streets are very often found in many developing countries!
  location: text('location').notNull(),
  // wasteType will be categorized by AI
  wasteType: varchar('waste_type', {length: 255}).notNull(),
  // the amount of waste will be estimated by AI
  // amount: integer('amount').notNull(),
  amount: varchar("amount", { length: 255 }).notNull(),
  // the captured image that user reported in!
  imageURL: text('image_url'),
  // the AI api returns a json object. This json object includes garbage type (str), estimation confidence level (numerical percentage), etc.
  inferenceResult: jsonb('inference_result'),
  // the status of the report
  status: varchar('status', {length: 255}).notNull().default('pending'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  // collectorID (optional field), ref from userID
  collectorID: integer('collector_id').references(() => UserTable.id),


})


// define schema for reward table 
export const RewardTable = pgTable('rewards', {
  id: serial('id').primaryKey(),
  userID: integer('user_id').references(() => UserTable.id).notNull(),
  // karma score ~ reward score, the concept inspired from reddit karma score to indicate the consistent and valuable contributions, promote making positive impact and encouraging others to join !
  karmaScore: integer('karma_score').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  // tell us whether the reward is available or not. This means in order to claim for the reward, the user (reporter) has to take action, which is to collect the garbage ?!
  isAvailable: boolean('is_available').notNull().default(true),
  rewardDescription: text('reward_description'),
  rewardName: varchar('reward_name', {length: 255}).notNull(),
  // the information on how to collect the reward
  rewardClaimInfo: text('reward_claim_info').notNull(),

}) 

export const CollectedWasteTable = pgTable('collected_waste', {
  id: serial('id').primaryKey(),
  // userID foreign key for report table
  reportID: integer('report_id').references( ()=> ReportTable.id).notNull(),

  // collectorID foreign key for user table, this is needed because we use to reward to user (garbage collector)
  collectorID: integer('collector_id').references(() => UserTable.id).notNull(),
  collectionDate: timestamp('collection_date').notNull(),
  // to update the status of the report to collected after everything is done !
  status: varchar('status', {length: 255}).notNull().default('collected'),

})

// 

export const NotificationTable = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userID: integer('user_id').references(() => UserTable.id).notNull(),
  message: text('message').notNull(),
  // notification types: report award/ collect award..
  type: varchar('type', {length: 50}).notNull(),
  isRead: boolean('is_read').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),


})

export const TransactionTable = pgTable('transactions', {
  id: serial('id').primaryKey(),
  userID: integer('user_id').references(() => UserTable.id).notNull(),
  // type of transaction: whether the transaction is ended or it's a redeemed transaction
  type: varchar('type', {length: 20}).notNull(),
  amount: integer('amount').notNull(),
  description: text('description').notNull(),
  date: timestamp('date').defaultNow().notNull(),

})