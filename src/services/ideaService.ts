export interface IdeaSubmit {
  id: string;
  senderName: string;
  userId?: string;
  schoolId?: string;
  title: string;
  description: string;
  category: 'academic' | 'behavior' | 'administrative' | 'other';
  timestamp: any;
  status: 'pending' | 'under_review' | 'implemented' | 'rejected';
  adminReply?: string;
  targetGrade?: string;
  readByParent?: boolean;
}

export interface CouncilPoll {
  id: string;
  schoolId?: string;
  title: string;
  description: string;
  type: 'admin' | 'parent';
  authorId?: string;
  authorName?: string;
  status: 'active' | 'closed' | 'implemented' | 'rejected';
  adminReply?: string;
  votes: Record<string, 'support' | 'reject'>;
  comments?: {
    id: string;
    authorName: string;
    text: string;
    timestamp: number;
  }[];
  timestamp: any;
  targetGrade?: string;
}

export const ideaService = {
  fetchIdeas: async (schoolId?: string, userId?: string) => {
    let url = `/api/idea-bank?`;
    if (schoolId) url += `schoolId=${schoolId}&`;
    if (userId) url += `userId=${userId}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch ideas');
    const data = await response.json();
    return data.ideas as IdeaSubmit[];
  },

  createIdea: async (payload: Omit<IdeaSubmit, 'id' | 'timestamp'>) => {
    const response = await fetch('/api/idea-bank', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error('Failed to create idea');
    return await response.json();
  },

  updateIdea: async (id: string, updates: Partial<IdeaSubmit>) => {
    const response = await fetch(`/api/idea-bank/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!response.ok) throw new Error('Failed to update idea');
    return await response.json();
  },

  deleteIdea: async (id: string) => {
    const response = await fetch(`/api/idea-bank/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete idea');
    return await response.json();
  },

  // Council Polls
  fetchPolls: async (schoolId?: string) => {
    const response = await fetch(`/api/council-polls${schoolId ? `?schoolId=${schoolId}` : ''}`);
    if (!response.ok) throw new Error('Failed to fetch polls');
    const data = await response.json();
    return data.polls as CouncilPoll[];
  },

  createPoll: async (payload: Omit<CouncilPoll, 'id' | 'timestamp'>) => {
    const response = await fetch('/api/council-polls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error('Failed to create poll');
    return await response.json();
  },

  updatePoll: async (id: string, updates: Partial<CouncilPoll>) => {
    const response = await fetch(`/api/council-polls/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!response.ok) throw new Error('Failed to update poll');
    return await response.json();
  },

  deletePoll: async (id: string) => {
    const response = await fetch(`/api/council-polls/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete poll');
    return await response.json();
  }
};
