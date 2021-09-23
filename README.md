Expamle of extending
```javascript
import { initialState, createFileSystemSlice } from '@use-fs/zustand';

const extendedInitialState = {
  ...initialState,
  newFsContents: { root: [] },
  something: false,
}

const createExtendedFsSlice = (set, get) => ({
  ...createFileSystemSlice(set, get, extendedInitialState),
  setSomething: (bool) => set({ something: bool }),
});

export default createExtendedFsSlice;
```

