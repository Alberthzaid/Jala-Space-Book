import { useContext } from 'react';

import { LoansContext, type LoansContextValue } from './LoansProvider';

export function useLoans(): LoansContextValue {
  const context = useContext(LoansContext);
  if (!context) throw new Error('useLoans must be used inside <LoansProvider>');
  return context;
}
