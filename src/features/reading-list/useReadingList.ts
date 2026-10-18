import { useContext } from 'react';

import { ReadingListContext, type ReadingListContextValue } from './ReadingListProvider';

export function useReadingList(): ReadingListContextValue {
  const context = useContext(ReadingListContext);
  if (!context) throw new Error('useReadingList must be used inside <ReadingListProvider>');
  return context;
}
