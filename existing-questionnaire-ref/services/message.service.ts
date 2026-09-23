import { mockConversations } from "../mocks/patient-portal.mock";
import type { Conversation, ChatMessage } from "../types/patient-portal";

const STORAGE_KEY = "breastcare_conversations_v1";

export class MessageService {
  private static getStoredConversations(): Conversation[] {
    if (typeof window === "undefined") return mockConversations;
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(mockConversations));
        return mockConversations;
      }
      return JSON.parse(data);
    } catch (e) {
      console.error("Failed to parse stored conversations", e);
      return mockConversations;
    }
  }

  private static saveConversations(convs: Conversation[]): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(convs));
      window.dispatchEvent(new CustomEvent("patient-updated"));
      try {
        const channel = new BroadcastChannel("breastcare-sync");
        channel.postMessage({ type: "patient-updated" });
      } catch (e) {
        // BroadcastChannel optional
      }
    } catch (e) {
      console.error("Failed to save conversations", e);
    }
  }

  static getConversations(): Conversation[] {
    return this.getStoredConversations();
  }

  static getConversationsForPatient(patientId: string): Conversation[] {
    const convs = this.getStoredConversations();
    return convs.filter(c => c.patientId === patientId || c.patientId === "patient-001");
  }

  static getMessagesForPatient(patientId: string): ChatMessage[] {
    const convs = this.getConversationsForPatient(patientId);
    return convs.flatMap(c => c.messages).sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
  }

  static sendMessage(params: {
    conversationId?: string;
    patientId: string;
    senderId: string;
    senderName: string;
    senderRole: "Doctor" | "Patient" | "Coordinator" | "System";
    content: string;
  }): ChatMessage {
    const convs = this.getStoredConversations();
    const sentAt = new Date().toISOString();
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

    let targetConv = convs.find(c => (params.conversationId && c.id === params.conversationId) || c.patientId === params.patientId);

    const newMsg: ChatMessage = {
      id: messageId,
      conversationId: targetConv?.id || `conv-${params.patientId}`,
      senderId: params.senderId,
      senderName: params.senderName,
      senderRole: params.senderRole,
      content: params.content,
      sentAt,
    };

    if (targetConv) {
      const updatedConvs = convs.map(c => {
        if (c.id === targetConv!.id) {
          return {
            ...c,
            lastMessage: params.content,
            lastMessageAt: sentAt,
            unreadCount: params.senderRole === "Patient" ? c.unreadCount + 1 : c.unreadCount,
            messages: [...c.messages, newMsg]
          };
        }
        return c;
      });
      this.saveConversations(updatedConvs);
    } else {
      // Create new conversation if none exists
      const newConv: Conversation = {
        id: `conv-${params.patientId}`,
        patientId: params.patientId,
        participantName: params.senderRole === "Patient" ? params.senderName : "Dr. Sarah Iyer",
        participantRole: params.senderRole === "Patient" ? "Doctor" : "Patient" as any,
        participantInitials: params.senderName ? params.senderName.split(" ").map(n => n[0]).join("") : "SI",
        lastMessage: params.content,
        lastMessageAt: sentAt,
        unreadCount: params.senderRole === "Patient" ? 1 : 0,
        isPinned: false,
        messages: [newMsg]
      };
      this.saveConversations([newConv, ...convs]);
    }

    return newMsg;
  }

  static markAsRead(conversationId: string): void {
    const convs = this.getStoredConversations();
    const updated = convs.map(c => {
      if (c.id === conversationId) {
        return { ...c, unreadCount: 0 };
      }
      return c;
    });
    this.saveConversations(updated);
  }
}
