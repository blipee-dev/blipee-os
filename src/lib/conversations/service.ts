import { createClient } from "@/lib/supabase/client";
import { Message } from "@/types/conversation";
import type { Database } from "@/types/supabase";
import { messagesToJson } from "./utils";

export type ConversationRow =
  Database["public"]["Tables"]["conversations"]["Row"];
export type ConversationInsert =
  Database["public"]["Tables"]["conversations"]["Insert"];
export type ConversationUpdate =
  Database["public"]["Tables"]["conversations"]["Update"];

export class ConversationService {
  private supabase = createClient();
  private isSupabaseAvailable = true; // Assume available initially

  constructor() {
    this.checkSupabaseConnection();
  }

  private async checkSupabaseConnection() {
    try {
      // Check if Supabase environment variables are set
      if (
        typeof window !== "undefined" &&
        (!process.env['NEXT_PUBLIC_SUPABASE_URL'] ||
          !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
      ) {
        console.log(
          "📝 Supabase not configured - using local storage for demo mode",
        );
        this.isSupabaseAvailable = false;
        return;
      }
    } catch (error) {
      console.log(
        "📝 Supabase not available - using local storage for demo mode",
      );
      this.isSupabaseAvailable = false;
    }
  }

  /**
   * Create a new conversation
   */
  async createConversation(buildingId?: string): Promise<string | null> {
    // Always use localStorage for demo mode to avoid Supabase errors
    if (typeof window !== "undefined") {
      // Generate demo conversation ID
      const demoId = `demo-conversation-${Date.now()}`;
      localStorage.setItem(
        `conversation-${demoId}`,
        JSON.stringify({
          id: demoId,
          user_id: "demo-user",
          building_id: buildingId || "demo-building",
          messages: [],
          context: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }),
      );
      return demoId;
    }

    return `demo-conversation-${Date.now()}`;
  }

  /**
   * Get conversation by ID
   */
  async getConversation(
    conversationId: string,
  ): Promise<ConversationRow | null> {
    // Use localStorage for demo mode
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(`conversation-${conversationId}`);
      if (stored) {
        return JSON.parse(stored) as ConversationRow;
      }
    }
    return null;
  }

  /**
   * Get all conversations for the current user
   */
  async getUserConversations(): Promise<ConversationRow[]> {
    const { data: userData } = await this.supabase.auth.getUser();

    if (!userData?.user) {
      return [];
    }

    const { data, error } = await this.supabase
      .from("conversations")
      .select("*")
      .eq("user_id", userData.user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching conversations:", error);
      return [];
    }

    return data || [];
  }

  /**
   * Add messages to conversation
   */
  async addMessages(
    conversationId: string,
    messages: Message[],
  ): Promise<boolean> {
    // Update localStorage for demo mode
    if (typeof window !== "undefined") {
      const conversation = await this.getConversation(conversationId);
      if (conversation) {
        const existingMessages = Array.isArray(conversation.messages)
          ? (conversation.messages as any[])
          : [];

        const newMessagesJson = messagesToJson(messages);
        const updatedMessages = [
          ...existingMessages,
          ...(newMessagesJson as any[]),
        ];

        const updatedConversation = {
          ...conversation,
          messages: updatedMessages,
          updated_at: new Date().toISOString(),
        };

        localStorage.setItem(
          `conversation-${conversationId}`,
          JSON.stringify(updatedConversation),
        );
        return true;
      }
    }
    return false;
  }

  /**
   * Update conversation context
   */
  async updateContext(
    conversationId: string,
    context: Record<string, any>,
  ): Promise<boolean> {
    const { error } = await this.supabase
      .from("conversations")
      .update({
        context,
        updated_at: new Date().toISOString(),
      })
      .eq("id", conversationId);

    if (error) {
      console.error("Error updating context:", error);
      return false;
    }

    return true;
  }

  /**
   * Get or create a demo conversation
   */
  async getOrCreateDemoConversation(): Promise<string | null> {
    // For demo, we'll use localStorage to persist the conversation ID
    if (typeof window !== "undefined") {
      const storedId = localStorage.getItem("demo_conversation_id");

      if (storedId) {
        // Verify it still exists
        const conversation = await this.getConversation(storedId);
        if (conversation) {
          return storedId;
        }
      }

      // Create new demo conversation
      const newId = await this.createConversation("demo-building");
      if (newId) {
        localStorage.setItem("demo_conversation_id", newId);
      }
      return newId;
    }

    return null;
  }

  /**
   * Subscribe to conversation updates (real-time)
   */
  subscribeToConversation(
    conversationId: string,
    callback: (payload: any) => void,
  ) {
    return this.supabase
      .channel(`conversation:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversations",
          filter: `id=eq.${conversationId}`,
        },
        callback,
      )
      .subscribe();
  }
}

// Export singleton instance
export const conversationService = new ConversationService();
