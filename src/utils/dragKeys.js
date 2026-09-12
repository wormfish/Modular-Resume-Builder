/**
 * Shared DataTransfer keys used across drag-and-drop components.
 * Keep in sync between producers (ResumeBlock, BlockLibrary) and consumers (ResumeCanvas, BlockLibrary).
 */
export const DRAG_KEYS = {
  BLOCK_ID: 'application/x-block-id',
  SOURCE: 'application/x-drag-source',
  SOURCE_SECTION: 'application/x-source-section',
  SOURCE_INDEX: 'application/x-source-index',
  SECTION_INDEX: 'application/x-section-index',
  SECTION_TITLE: 'application/x-section-title',
};

export const DRAG_SOURCE = {
  LIBRARY: 'library',
  CANVAS: 'canvas',
  SECTION: 'section',
};
