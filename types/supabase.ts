export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      shops: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          slug: string
          plan: 'free' | 'business' | 'premium'
          image_url: string | null
          is_vacant: boolean | null
          description: string | null
          website_url: string | null
          instagram_url: string | null
          twitter_url: string | null
          owner_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          name: string
          slug: string
          plan?: 'free' | 'business' | 'premium'
          image_url?: string | null
          is_vacant?: boolean | null
          description?: string | null
          website_url?: string | null
          instagram_url?: string | null
          twitter_url?: string | null
          owner_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          name?: string
          slug?: string
          plan?: 'free' | 'business' | 'premium'
          image_url?: string | null
          is_vacant?: boolean | null
          description?: string | null
          website_url?: string | null
          instagram_url?: string | null
          twitter_url?: string | null
          owner_id?: string | null
        }
      }
      tournaments: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          shop_id: string
          title: string
          start_at: string
          end_at: string | null
          buy_in: string | null
          stack: string | null
          blind: string | null
          tags: string[] | null
          details: Json | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          shop_id: string
          title: string
          start_at: string
          end_at?: string | null
          buy_in?: string | null
          stack?: string | null
          blind?: string | null
          tags?: string[] | null
          details?: Json | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          shop_id?: string
          title?: string
          start_at?: string
          end_at?: string | null
          buy_in?: string | null
          stack?: string | null
          blind?: string | null
          tags?: string[] | null
          details?: Json | null
        }
      }
      profiles: {
        Row: {
          id: string
          created_at: string
          display_name: string | null
          avatar_url: string | null
          is_vip: boolean
          vip_since: string | null
          vip_expires_at: string | null
        }
        Insert: {
          id: string
          created_at?: string
          display_name?: string | null
          avatar_url?: string | null
          is_vip?: boolean
          vip_since?: string | null
          vip_expires_at?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          display_name?: string | null
          avatar_url?: string | null
          is_vip?: boolean
          vip_since?: string | null
          vip_expires_at?: string | null
        }
      }
      photo_albums: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          title: string
          description: string | null
          cover_image_url: string | null
          event_date: string
          is_published: boolean
          photo_count: number
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          title: string
          description?: string | null
          cover_image_url?: string | null
          event_date: string
          is_published?: boolean
          photo_count?: number
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          title?: string
          description?: string | null
          cover_image_url?: string | null
          event_date?: string
          is_published?: boolean
          photo_count?: number
        }
      }
      photo_album_photos: {
        Row: {
          id: string
          created_at: string
          album_id: string
          image_url: string
          thumbnail_url: string | null
          caption: string | null
          sort_order: number
        }
        Insert: {
          id?: string
          created_at?: string
          album_id: string
          image_url: string
          thumbnail_url?: string | null
          caption?: string | null
          sort_order?: number
        }
        Update: {
          id?: string
          created_at?: string
          album_id?: string
          image_url?: string
          thumbnail_url?: string | null
          caption?: string | null
          sort_order?: number
        }
      }
    }
  }
}
