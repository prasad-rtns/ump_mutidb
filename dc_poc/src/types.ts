import type { NavigatorScreenParams } from "@react-navigation/native";

export type EventItem = {
  id: string;
  title: string;
  date: string;
  venue: string;
  summary: string;
  category: string;
  imageUrl: string;
};

export type OpenCallItem = {
  id: string;
  title: string;
  deadline: string;
  summary: string;
  department: string;
};

export type NewsItem = {
  id: string;
  title: string;
  date: string;
  excerpt: string;
  imageUrl: string;
};

export type ServiceSection = {
  title: string;
  description: string;
  imageUrl: string;
};

export type ExploreTile = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
};

export type AttractionCategory = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
};

export type PlaceItem = {
  id: string;
  categoryId: string;
  name: string;
  area: string;
  summary: string;
  imageUrl: string;
};

export type GalleryItem = {
  id: string;
  title: string;
  imageUrl: string;
};

export type WhatsOnStackParamList = {
  WhatsOnHome: undefined;
  EventDetails: { event: EventItem };
  OpenCallDetails: { openCall: OpenCallItem };
};

export type AttractionStackParamList = {
  AttractionsHome: undefined;
  PlaceList: { categoryId: string };
  PlaceDetail: { place: PlaceItem };
};

export type MoreStackParamList = {
  MoreMenu: undefined;
  Login: undefined;
  About: undefined;
  EServices: undefined;
  Contact: undefined;
  Legal: undefined;
};

export type RootTabParamList = {
  Home: undefined;
  Attractions: NavigatorScreenParams<AttractionStackParamList> | undefined;
  WhatsOn: NavigatorScreenParams<WhatsOnStackParamList> | undefined;
  Discover: undefined;
  More: NavigatorScreenParams<MoreStackParamList> | undefined;
};

export type QuickLink = {
  id: string;
  label: string;
  icon: "calendar" | "map" | "images" | "document" | "call" | "globe";
  target:
    | {
        type: "nested";
        tab: keyof RootTabParamList;
        screen: string;
        params?: Record<string, unknown>;
      }
    | { type: "tab"; tab: keyof RootTabParamList }
    | { type: "url"; url: string };
};

/** @deprecated use WhatsOnStackParamList */
export type EventStackParamList = WhatsOnStackParamList;
