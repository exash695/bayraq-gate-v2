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
    
    let title = "تفاعل جديد على الساحة التفاعلية";
    if (type === "like") title = `أعجب ${senderName} بمنشورك`;
    else if (type === "comment") title = `علّق ${senderName} على منشورك`;
    else if (type === "reaction") title = `تفاعل ${senderName} مع منشورك`;
    else if (type === "share") title = `أعاد ${senderName} مشاركة منشورك`;
    else if (type === "mention_post") title = `أشار إليك ${senderName} في منشور`;

    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipientId: targetId,
        title: title,
        message: postContent,
        body: postContent,
        type: 'social',
        studentName: senderName,
        metadata: {
          senderName,
          senderPhoto,
          actionType: type,
        },
        read: false
      })
    });
  } catch (err) {
    console.error("Failed to push social notification", err);
  }
};
