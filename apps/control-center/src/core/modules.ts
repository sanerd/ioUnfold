export interface ModuleManifest {
  id: string;
  title: string;
  icon: string;
  path: string;
}

import { floorballManifest } from '../modules/floorball/index.js';

export const ADMIN_MODULES = [
  floorballManifest
  // recipeManifest,
];
