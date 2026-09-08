export const pushSocialNotification = async (
  recipientUserId: string | null,
  recipientName: string | null,
  senderName: string,
  senderPhoto: string | null,
  type: string,
  postContent: string,
) => {
  if (!recipientUserId && !recipientName) return;
  try {
    const targetId = recipientUserId || recipientName || 'all';
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipientId: targetId,
        title: type,
        body: postContent,
        type: type,
        read: false
      })
    });
  } catch (err) {
    console.error("Failed to push social notification", err);
  }
};
