
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { differenceInDays } from "date-fns";

admin.initializeApp();

const db = admin.firestore();

// This function will run every day at 8:00 AM in the timezone of your project settings.
export const dailyExpiryCheck = functions.pubsub
  .schedule("every day 08:00")
  .onRun(async (context) => {
    console.log("Running daily expiry check...");

    const pantriesSnapshot = await db.collection("pantries").get();
    if (pantriesSnapshot.empty) {
      console.log("No pantries found.");
      return null;
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

        const expiringItems = pantryData.items
          .map((item: any) => {
            const addedDate = item.addedDate.toDate();
            const expiryDate = new Date(addedDate);
            expiryDate.setDate(addedDate.getDate() + item.shelfLife);
            const remainingDays = differenceInDays(expiryDate, today);
            return {
              name: item.name,
              remainingDays,
            };
          })
          .filter((item: { name: string; remainingDays: number }) => 
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

          // Construct the email content
          const emailHtml = `
            <h1>PantryPal Expiry Alert!</h1>
            <p>Hello! You have some items in your pantry that are expiring soon:</p>
            <ul>
              ${expiringItems
                .map((item: { name: string; remainingDays: number }) => {
                  const dayText =
                    item.remainingDays === 0
                      ? "Expires today"
                      : `Expires in ${item.remainingDays} day${item.remainingDays === 1 ? "" : "s"}`;
                  return `<li><b>${item.name}</b>: ${dayText}</li>`;
                })
                .join("")}
            </ul>
            <p>Log in to PantryPal to manage your items and prevent food waste!</p>
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
    return null;
  });
