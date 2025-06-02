import { 
  collection, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc, 
  getDocs,
  getDoc, 
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Group, UserProfile } from '../types';

export const createGroup = async (groupData: Omit<Group, 'id' | 'groupCode' | 'createdAt'>): Promise<string> => {
  try {
    // Generate a random 6-character group code
    const groupCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const newGroup: Omit<Group, 'id'> = {
      ...groupData,
      groupCode,
      createdAt: new Date().toISOString(),
    };
    
    const docRef = await addDoc(collection(db, 'groups'), newGroup);
    return docRef.id;
  } catch (error) {
    console.error('Error creating group:', error);
    throw error;
  }
};

export const getGroupById = async (groupId: string): Promise<Group | null> => {
  try {
    const docRef = doc(db, 'groups', groupId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Group;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting group:', error);
    throw error;
  }
};

export const getUserGroups = async (userId: string): Promise<Group[]> => {
  try {
    const q = query(
      collection(db, 'groups'),
      where('members', 'array-contains', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const groups: Group[] = [];
    
    querySnapshot.forEach((doc) => {
      groups.push({ id: doc.id, ...doc.data() } as Group);
    });
    
    return groups;
  } catch (error) {
    console.error('Error getting user groups:', error);
    throw error;
  }
};

export const joinGroupByCode = async (groupCode: string, userId: string, userProfile: UserProfile): Promise<Group | null> => {
  try {
    const q = query(
      collection(db, 'groups'),
      where('groupCode', '==', groupCode)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      throw new Error('Group not found with the provided code');
    }
    
    const groupDoc = querySnapshot.docs[0];
    const groupData = groupDoc.data() as Group;
    
    // Check if user is already a member
    if (groupData.members.includes(userId)) {
      throw new Error('You are already a member of this group');
    }
    
    // Add user to the group
    await updateDoc(doc(db, 'groups', groupDoc.id), {
      members: [...groupData.members, userId],
    });
    
    return { id: groupDoc.id, ...groupData, members: [...groupData.members, userId] };
  } catch (error) {
    console.error('Error joining group:', error);
    throw error;
  }
};

export const leaveGroup = async (groupId: string, userId: string): Promise<void> => {
  try {
    const groupDoc = await getDoc(doc(db, 'groups', groupId));
    
    if (!groupDoc.exists()) {
      throw new Error('Group not found');
    }
    
    const groupData = groupDoc.data() as Group;
    
    // If user is the creator and the only member, delete the group
    if (groupData.createdBy === userId && groupData.members.length === 1) {
      await deleteDoc(doc(db, 'groups', groupId));
      return;
    }
    
    // If user is the creator but there are other members, throw an error
    if (groupData.createdBy === userId && groupData.members.length > 1) {
      throw new Error('As the creator, you cannot leave the group while other members remain. Transfer ownership first or delete the group.');
    }
    
    // Remove user from members
    await updateDoc(doc(db, 'groups', groupId), {
      members: groupData.members.filter(id => id !== userId),
    });
  } catch (error) {
    console.error('Error leaving group:', error);
    throw error;
  }
};

export const deleteGroup = async (groupId: string, userId: string): Promise<void> => {
  try {
    const groupDoc = await getDoc(doc(db, 'groups', groupId));
    
    if (!groupDoc.exists()) {
      throw new Error('Group not found');
    }
    
    const groupData = groupDoc.data() as Group;
    
    // Check if user is the creator
    if (groupData.createdBy !== userId) {
      throw new Error('Only the group creator can delete the group');
    }
    
    await deleteDoc(doc(db, 'groups', groupId));
  } catch (error) {
    console.error('Error deleting group:', error);
    throw error;
  }
};