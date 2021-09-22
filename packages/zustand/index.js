import { v4 as uuidv4 } from "uuid";

const getCurrentTimeStamp = () => +new Date();
export const initialState = {
  files: {},
  folders: {},
  dirContents: { root: [] },
  currentDir: "root",
  currentDirItems: {
    folders: [],
    files: [],
    mixed: [],
  },
  previewListToUpload: [],
  previewedItem: {
    item: null,
    isOpen: false,
  },
  destinationContainerId: "root",
};

// TODO reduce computation complexity e.g ( use new Set() instead of Object.fromEntries )
export const createFileSystemSlice = (set, get, extendedInitialState = initialState) => ({
  fs: extendedInitialState,
  clearFs: () => set((state) => ({fs: extendedInitialState})),
  saveIdToDirContents: (id, destId, dirContents = 'dirContents' ) => {
    set((state) => ({
      fs: {
        ...state.fs,
        [dirContents]: {
          ...state.fs.[dirContents],
          [destId]: [...state.fs.[dirContents][destId], id],
        },
      },
    }));
    get().setCurrentDirItems(get().fs.currentDir);
  },
  rmIdFromDirContents: (id, dirContents = 'dirContents') => {
    set((state) => ({
      fs: {
        ...state.fs,
        [dirContents]: {
          ...state.fs.[dirContents],
          [state.fs.currentDir]: [
            ...state.fs.[dirContents][state.fs.currentDir].filter(
              (x) => x !== id
            ),
          ],
        },
      },
    }));
  },
  filterIdFromCollection: (id, type) => {
    set((state) => ({
      fs: {
        ...state.fs,
        [type]: Object.fromEntries(
          Object.entries(state.fs[type]).filter(([k, v]) => k !== id)
        ),
      },
    }));
  },
  rmFolderRecur: (id, dirContents = "dirContents") => {
    if (get().fs.[dirContents][id]) {
      for (const uuid of get().fs.[dirContents][id]) {
        get().filterIdFromCollection(uuid, "folders");
        get().filterIdFromCollection(uuid, "files");
        if (get().fs.[dirContents][uuid]) {
          get().rmFolderRecur(uuid);
          get().filterIdFromCollection(uuid, dirContents);
        }
      }
    }
  },
  rmUploadPreview: (index) => {
    console.log('index value', index)
    set((state) => ({
      fs: {
        ...state.fs,
        previewListToUpload: index !== null ? [
          ...state.fs.previewListToUpload.filter((x, idx) => idx !== index),
        ] : [],
      },
    }))
  },
  setUploadPreview: async (file, isBase64 = true) => {
    const id = uuidv4();
    let reader = new FileReader();
    await reader.readAsDataURL(file);
    reader.onload = function () {
      console.log(reader.result);
      const base64 = reader.result;
      set((state) => ({
        fs: {
          ...state.fs,
          previewListToUpload: [
            ...state.fs.previewListToUpload,
            {
              fileBlob: file,
              fileObj: {
                id,
                lastModified: getCurrentTimeStamp(),
                deviceModified: file.lastModified,
                name: file.name,
                type: file.type,
                size: file.size,
                webkitRelativePath: file.webkitRelativePath,
                fsType: "file",
                isPrivate: false,
              },
              base64: isBase64 && base64,
              status: "ready",
              progress: 0,
            },
          ],
        },
      }));
    };
    reader.onerror = function (error) {
      console.log('Error: ', error);
    };
  },
  setItemPreview: (item, isOpen) => set((state) => ({ fs: { ...state.fs, previewedItem: { item, isOpen } }})),
  setDestinationContainerId: (id) => set((state) => ({ fs: { ...state.fs, destinationContainerId: id } })),
  setCurrentDir: (id) => set((state) => ({ fs: { ...state.fs, currentDir: id } })),
  setCurrentDirItems: (currentFolderId = "root",  dirContents = "dirContents") => {
    set((state) => ({
      fs: {
        ...state.fs,
        currentDirItems: {
          folders: [...state.fs.[dirContents][currentFolderId].map(
            (id) => state.fs.folders[id]
          ).filter(Boolean)],
          files: [...state.fs.[dirContents][currentFolderId].map(
            (id) => state.fs.files[id]
          ).filter(Boolean)],
          mixed: [
            ...state.fs.[dirContents][currentFolderId].map(
              (id) => state.fs.folders[id]
            ).filter(Boolean),
            ...state.fs.[dirContents][currentFolderId].map(
              (id) => state.fs.files[id]
            ).filter(Boolean),
          ],
        },
      },
    }));
  },
  mkdir: (name, destId, dirContents = "dirContents", object) => {
    const id = uuidv4();
    set((state) => ({
      fs: {
        ...state.fs,
        folders: {
          ...state.fs.folders,
          [id]: object || {
            id,
            name,
            fsType: "folder",
            lastModified: getCurrentTimeStamp(),
          },
        },
        [dirContents]: { ...state.fs.[dirContents], [id]: [], },
      },
    }));
    get().saveIdToDirContents(id, destId || get().fs.currentDir, dirContents);
  },
  touch: (item, destId, dirContents = "dirContents") => {
    set((state) => ({
      fs: {
        ...state.fs,
        files: { ...state.fs.files, [item.id]: item },
      },
    }));
    get().saveIdToDirContents(item.id, destId || get().fs.currentDir, dirContents);
  },
  rm: (id, dirContents = "dirContents") => {
    get().rmFolderRecur(id);
    get().filterIdFromCollection(id, "folders");
    get().filterIdFromCollection(id, "files");
    get().filterIdFromCollection(id, dirContents);
    get().rmIdFromDirContents(id, dirContents);
    get().setCurrentDirItems(get().fs.currentDir, dirContents);
  },
  mv: (id, destId, dirContents = "dirContents") => {
    get().rmIdFromDirContents(id, dirContents);
    get().saveIdToDirContents(id, destId, dirContents);
  },
  rename: (id, name, type, dirContents = "dirContents") => {
    console.log('id name type', id, name, type)
    set((state) => ({
      fs: {
        ...state.fs,
        [`${type}s`]: {
          ...state.fs[`${type}s`],
          [id]: { ...state.fs[`${type}s`][id], name },
        },
      },
    }));
    get().setCurrentDirItems(get().fs.currentDir, dirContents);
  },
});
