/** Desktop notifications — notify when AI finishes turn (background tab) */

let permissionGranted = false;

export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") {
    permissionGranted = true;
    return true;
  }
  if (Notification.permission === "denied") return false;

  const result = await Notification.requestPermission();
  permissionGranted = result === "granted";
  return permissionGranted;
}

export function sendNotification(title: string, body: string): void {
  if (!permissionGranted || document.hasFocus()) return;
  try {
    new Notification(title, {
      body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: "battleship-turn",
    });
  } catch {
    // Notifications not supported or blocked
  }
}

export function notifyYourTurn(): void {
  sendNotification("Battleship", "It's your turn! The enemy has fired.");
}

export function notifyGameOver(won: boolean): void {
  sendNotification(
    "Battleship",
    won ? "Victory! You sank all enemy ships!" : "Defeat! Your fleet has been destroyed.",
  );
}
