/**
 * Follow-Up Service for Crisis Situations
 * 
 * This service manages scheduled follow-ups for veterans who have expressed
 * crisis thoughts but haven't confirmed they've contacted help.
 */

import { clientPromise } from '@/lib/mongodb';
import { Document, WithId } from 'mongodb';
import { detectCrisis, CrisisFlag } from './crisisProtocol';
import { chat, Message } from './grokService';

/**
 * Follow-up record interface
 */
interface FollowUpRecord {
  userId: string;
  sessionId: string;
  createdAt: Date;
  scheduledFor: Date;
  crisisType: string;
  lastMessage: string;
  status: 'pending' | 'completed' | 'cancelled';
  attempts: number;
  maxAttempts: number;
  notes?: string;
}

/**
 * Schedule a follow-up for a user in crisis
 */
export async function scheduleFollowUp(
  userId: string,
  sessionId: string,
  message: string,
  crisisFlag: CrisisFlag
): Promise<boolean> {
  try {
    const client = await clientPromise;
    const db = client.db('vet1stop');
    
    // Check if there's already a pending follow-up for this user
    const existingFollowUp = await db.collection('followUps').findOne({
      userId,
      status: 'pending'
    });
    
    if (existingFollowUp) {
      // Update the existing follow-up with the new information
      await db.collection('followUps').updateOne(
        { _id: existingFollowUp._id },
        { 
          $set: {
            lastMessage: message,
            crisisType: crisisFlag,
            updatedAt: new Date()
          }
        }
      );
      
      return true;
    }
    
    // Create a new follow-up record
    // Schedule follow-up for 30 minutes later for high severity, 2 hours for others
    const delayMinutes = 
      crisisFlag === CrisisFlag.SUICIDAL_IDEATION || 
      crisisFlag === CrisisFlag.HARM_TO_OTHERS ? 30 : 120;
    
    const scheduledFor = new Date();
    scheduledFor.setMinutes(scheduledFor.getMinutes() + delayMinutes);
    
    const followUp: FollowUpRecord = {
      userId,
      sessionId,
      createdAt: new Date(),
      scheduledFor,
      crisisType: crisisFlag,
      lastMessage: message,
      status: 'pending',
      attempts: 0,
      maxAttempts: 3
    };
    
    await db.collection('followUps').insertOne(followUp);
    
    console.log(`Scheduled crisis follow-up for user ${userId} at ${scheduledFor.toISOString()}`);
    return true;
  } catch (error) {
    console.error('Error scheduling follow-up:', error);
    return false;
  }
}

/**
 * Process a user response to determine if follow-up is still needed
 */
export async function processFollowUpResponse(
  userId: string,
  message: string
): Promise<boolean> {
  try {
    const client = await clientPromise;
    const db = client.db('vet1stop');
    
    // Find any pending follow-ups for this user
    const pendingFollowUp = await db.collection('followUps').findOne({
      userId,
      status: 'pending'
    });
    
    if (!pendingFollowUp) {
      return false;
    }
    
    // Check if the message indicates the user has sought help
    const indicatesHelpSought = checkIfHelpSought(message);
    
    if (indicatesHelpSought) {
      // Update the follow-up status to completed
      await db.collection('followUps').updateOne(
        { _id: pendingFollowUp._id },
        { 
          $set: {
            status: 'completed',
            notes: 'User indicated they sought help',
            completedAt: new Date()
          }
        }
      );
      
      return true;
    }
    
    // Check if the message still indicates crisis
    const crisisFlag = detectCrisis(message);
    
    if (crisisFlag !== CrisisFlag.NONE) {
      // Update the crisis type if it has changed
      await db.collection('followUps').updateOne(
        { _id: pendingFollowUp._id },
        { 
          $set: {
            crisisType: crisisFlag,
            lastMessage: message,
            updatedAt: new Date()
          }
        }
      );
    }
    
    return false;
  } catch (error) {
    console.error('Error processing follow-up response:', error);
    return false;
  }
}

/**
 * Check if a message indicates the user has sought help
 */
function checkIfHelpSought(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  
  const helpSoughtPatterns = [
    /called\s+the\s+(crisis|veterans|va)\s+line/i,
    /i\s+(called|contacted|reached\s+out\s+to)\s+them/i,
    /i\s+talked\s+to\s+(someone|a\s+counselor|a\s+therapist|the\s+hotline)/i,
    /i\s+got\s+help/i,
    /i\s+am\s+talking\s+to\s+someone/i,
    /i\s+reached\s+out/i,
    /i\s+am\s+getting\s+help/i,
    /i\s+called\s+988/i,
    /i\s+texted\s+838255/i,
    /i\s+am\s+at\s+the\s+(va|hospital|emergency\s+room|er)/i,
    /i\s+am\s+with\s+(my\s+therapist|my\s+counselor|a\s+doctor)/i,
    /i\s+am\s+feeling\s+better/i,
    /i\s+am\s+safe/i
  ];
  
  for (const pattern of helpSoughtPatterns) {
    if (pattern.test(lowerMessage)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Process all pending follow-ups that are due
 * This should be called by a scheduled job
 */
export async function processPendingFollowUps(): Promise<number> {
  try {
    const client = await clientPromise;
    const db = client.db('vet1stop');
    
    // Find all follow-ups that are due
    const now = new Date();
    const pendingFollowUps = await db.collection('followUps')
      .find({
        status: 'pending',
        scheduledFor: { $lte: now },
        attempts: { $lt: 3 }
      })
      .toArray();
    
    let processedCount = 0;
    
    for (const followUp of pendingFollowUps) {
      // Increment the attempt counter
      await db.collection('followUps').updateOne(
        { _id: followUp._id },
        { 
          $inc: { attempts: 1 },
          $set: { lastAttemptAt: now }
        }
      );
      
      // Send the follow-up message
      await sendFollowUpMessage(followUp);
      
      // Schedule the next follow-up if needed
      if (followUp.attempts + 1 < followUp.maxAttempts) {
        const nextScheduledFor = new Date();
        nextScheduledFor.setHours(nextScheduledFor.getHours() + 24); // Next day
        
        await db.collection('followUps').updateOne(
          { _id: followUp._id },
          { $set: { scheduledFor: nextScheduledFor } }
        );
      } else {
        // Mark as completed after max attempts
        await db.collection('followUps').updateOne(
          { _id: followUp._id },
          { 
            $set: {
              status: 'completed',
              notes: 'Reached maximum follow-up attempts'
            }
          }
        );
      }
      
      processedCount++;
    }
    
    return processedCount;
  } catch (error) {
    console.error('Error processing pending follow-ups:', error);
    return 0;
  }
}

/**
 * Send a follow-up message to a user
 */
async function sendFollowUpMessage(followUp: WithId<Document> & Partial<FollowUpRecord>): Promise<boolean> {
  try {
    // Create the follow-up message
    const messages: Message[] = [
      {
        role: 'system',
        content: `This is a follow-up message for a veteran who previously expressed crisis thoughts (${followUp.crisisType}). 
Their last message was: "${followUp.lastMessage}"

Your goal is to check if they are safe and if they've reached out for help. Be compassionate but direct.
Remind them of crisis resources if needed. Keep the message brief and focused on their wellbeing.`
      },
      {
        role: 'user',
        content: 'Please send me a follow-up message to check on my wellbeing after I expressed crisis thoughts.'
      }
    ];
    
    // Get AI response
    const response = await chat(messages);
    
    // TODO: Actually send this message to the user via their preferred communication method
    // This would connect to a notification system, email, SMS, or in-app message
    
    console.log(`Sent follow-up message to user ${followUp.userId}: ${response.substring(0, 100)}...`);
    return true;
  } catch (error) {
    console.error('Error sending follow-up message:', error);
    return false;
  }
}

/**
 * Cancel a pending follow-up
 */
export async function cancelFollowUp(userId: string): Promise<boolean> {
  try {
    const client = await clientPromise;
    const db = client.db('vet1stop');
    
    const result = await db.collection('followUps').updateMany(
      { 
        userId,
        status: 'pending'
      },
      { 
        $set: {
          status: 'cancelled',
          cancelledAt: new Date()
        }
      }
    );
    
    return result.modifiedCount > 0;
  } catch (error) {
    console.error('Error cancelling follow-up:', error);
    return false;
  }
}
