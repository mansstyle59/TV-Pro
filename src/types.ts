export interface EpgProgramme {
  start: string;
  stop: string;
  title: string;
  desc?: string;
  category?: string;
  icon?: string;
  image?: string;
}

export interface Channel {
  country: string;
  id: number;
  name: string;
  p?: number;
  logo?: string;
  categoryOverride?: string;
  qualityLabel?: string;
  streamUrl?: string;
  groupTitle?: string;
  epg?: {
    current: EpgProgramme | null;
    next: EpgProgramme | null;
  };
}

export interface ChannelResponse {
  success: boolean;
  lastFetch: number;
  count: number;
  channels: Channel[];
}

export interface RegisteredUser {
  id: string;
  name: string;
  email: string;
  password?: string;
  registeredAt: string;
  role: "admin" | "user";
  subscriptionStatus: "active" | "expired" | "none";
  renewalDate: string;
}
