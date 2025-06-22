
import {onSchedule, type ScheduledEvent} from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";
import { differenceInDays } from "date-fns";

admin.initializeApp();

const db = admin.firestore();

// Define interfaces for better type safety
interface StoredPantryItem {
  id: string;
  name: string;
  shelfLife: number;
  addedDate: admin.firestore.Timestamp;
}

interface ExpiringItem {
  name: string;
  remainingDays: number;
}

// This function will run every day at 8:00 AM in the specified timezone.
export const dailyExpiryCheck = onSchedule({
  schedule: "every day 08:00",
  timeZone: "Asia/Singapore", // Timezone for asia-east1 region
  region: "asia-east1"
}, async (event: ScheduledEvent) => {
    console.log("Running daily expiry check for event: ", event.scheduleTime);

    const pantriesSnapshot = await db.collection("pantries").get();
    if (pantriesSnapshot.empty) {
      console.log("No pantries found.");
      return;
    }

    const today = new Date();
    const alertThresholdDays = 3; // Send alerts for items expiring in 3 days or less

    // Using Promise.all to handle all users concurrently
    await Promise.all(
      pantriesSnapshot.docs.map(async (pantryDoc) => {
        const userId = pantryDoc.id;
        const pantryData = pantryDoc.data();

        if (!pantryData.items || pantryData.items.length === 0) {
          return; // Skip users with empty pantries
        }

        const expiringItems: ExpiringItem[] = pantryData.items
          .map((item: StoredPantryItem) => {
            const addedDate = item.addedDate.toDate();
            const expiryDate = new Date(addedDate);
            expiryDate.setDate(addedDate.getDate() + item.shelfLife);
            const remainingDays = differenceInDays(expiryDate, today);
            return {
              name: item.name,
              remainingDays,
            };
          })
          .filter((item: ExpiringItem) => 
            item.remainingDays >= 0 && item.remainingDays <= alertThresholdDays
          );

        if (expiringItems.length === 0) {
          return; // No items expiring soon for this user
        }

        try {
          const user = await admin.auth().getUser(userId);
          const userEmail = user.email;

          if (!userEmail) {
            console.log(`User ${userId} has no email, cannot send alert.`);
            return;
          }

          // Construct a styled email
          const appUrl = `https://pantrypal-iyxgb.firebaseapp.com`;
          const emailHtml = `
            <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; background-color: #f9fafb;">
              <div style="max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
                <div style="background-color: #6d28d9; color: white; padding: 20px; text-align: center;">
                  <h1 style="margin:0; font-size: 24px;">PantryPal Expiry Alert!</h1>
                </div>
                <div style="padding: 20px;">
                  <p>Hello!</p>
                  <p>You have some items in your pantry that are expiring soon:</p>
                  <ul style="list-style-type: none; padding: 0;">
                    ${expiringItems
                      .map((item: ExpiringItem) => {
                        const dayText =
                          item.remainingDays === 0
                            ? "Expires today"
                            : `Expires in ${item.remainingDays} day${item.remainingDays === 1 ? "" : "s"}`;
                        return `<li style="background-color: #f3f4f6; margin-bottom: 10px; padding: 15px; border-radius: 5px; border-left: 5px solid #ef4444;"><b>${item.name}</b>: ${dayText}</li>`;
                      })
                      .join("")}
                  </ul>
                  <p>Log in to PantryPal to manage your items and prevent food waste!</p>
                  <a href="${appUrl}" style="display: inline-block; background-color: #6d28d9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 15px; font-weight: bold;">
                    Go to PantryPal
                  </a>
                </div>
                <div style="background-color: #f8f9fa; color: #6c757d; padding: 15px; text-align: center; font-size: 12px;">
                  <p>You are receiving this email because you have an account with PantryPal.</p>
                </div>
              </div>
            </body>
          `;

          // Create a document in the 'mail' collection to trigger the email extension
          await db.collection("mail").add({
            to: [userEmail],
            message: {
              subject: "You have items expiring soon in your Pantry!",
              html: emailHtml,
            },
          });

          console.log(`Email alert queued for user ${userEmail}`);

        } catch (error) {
          console.error(`Failed to process pantry for user ${userId}:`, error);
        }
      })
    );

    console.log("Daily expiry check complete.");
  });
