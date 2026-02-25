export interface Nameplate {
  name: string;
  asset: string;
  staticUrl: string;
  videoUrl?: string;
  label?: string;
  palette?: string;
  skuId: string;
}

export interface NameplateCollection {
  id: string;
  name: string;
  nameplates: Nameplate[];
}

export interface AvatarDecoration {
  name: string;
  staticUrl: string;
  animatedUrl?: string;
  label?: string;
  skuId: string;
}

export interface DecoCollection {
  id: string;
  name: string;
  decorations: AvatarDecoration[];
}

export interface ProfileEffect {
  name: string;
  staticUrl: string;
  animatedUrl?: string;
  label?: string;
  skuId: string;
}

export interface EffectCollection {
  id: string;
  name: string;
  effects: ProfileEffect[];
}
