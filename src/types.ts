export interface Point {
  x: number;
  y: number;
}

export interface Control {
  id: number;
  x: number;
  y: number;
}

export interface Variant {
  id: number;
  legIndex: number;
  points: Point[];
  color: string;
  name: string;
  labelOffset?: Point; // Position offset for the label
}

export interface Leg {
  index: number;
  start: Control;
  end: Control;
  label: string;
  straightLength: number;
}

export interface MapDimensions {
  width: number;
  height: number;
}

export interface PanState {
  x: number;
  y: number;
}

export type AppMode = 'controls' | 'variants' | 'calibrate';
