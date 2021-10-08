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
  uploadCandidates: [],
  previewedItem: {
    item: null,
    isOpen: false,
  },
  destinationContainerId: "root",
  trash: [],
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
    get().setCurrentDirItems(dirContents);
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
  clearUploadCandidates:(index) => {
    console.log('index value', index)
    set((state) => ({
      fs: {
        ...state.fs,
        uploadCandidates: []
      },
    }))
  },
  rmUploadCandidate: (index) => {
    console.log('index value', index)
    set((state) => ({
      fs: {
        ...state.fs,
        uploadCandidates: index !== null ? [
          ...state.fs.uploadCandidates.filter((x, idx) => idx !== index),
        ] : [],
      },
    }))
  },
  setUploadCandidate: (fileObject) => {
    set((state) => ({
      fs: {
        ...state.fs,
        uploadCandidates: [
          ...state.fs.uploadCandidates,
          fileObject
        ],
      },
    }));
  },
  // TODO seperate concerns, refactor?
  // file::File(Blob)
  setLocalFiles: async (
    file,
    destination,
    dirContents = 'dirContents',
    isBase64 = true,
    isBlob = true,
    isPrivate = false,
    isLocal = true
  ) => {
    const id = uuidv4();
    const fileObject = {
      id,
      fileObj: {
        id,
        lastModified: getCurrentTimeStamp(),
        deviceModified: file.lastModified,
        name: file.name,
        type: file.type,
        size: file.size,
        webkitRelativePath: file.webkitRelativePath,
        fsType: "file",
      },
      isPrivate: isPrivate,
      isLocal: isLocal,
      status: "ready",
      progress: 0,
    };
    if (isBase64) {
      let reader = new FileReader();
      await reader.readAsDataURL(file);
      reader.onload = () => {
        get().touch(
          {...fileObject, base64: reader.result, fileBlob: isBlob && file},
          destination,
          dirContents
        );
        // files will also be stored in uploadCandidates::[]
        get().setUploadCandidate({...fileObject, base64: reader.result, fileBlob: isBlob && file})
      };
      reader.onerror = (error) => console.warn('setUploadPreview() | Error: ', error);
    } else {
      get().touch(
        {...fileObject, base64: null, fileBlob: isBlob && file},
        destination,
        dirContents
      );
      get().setUploadCandidate({...fileObject, base64: null, fileBlob: isBlob && file})
    };
  },
  setItemPreview: (item, isOpen) => set((state) => ({ fs: { ...state.fs, previewedItem: { item, isOpen } }})),
  setDestinationContainerId: (id) => set((state) => ({ fs: { ...state.fs, destinationContainerId: id } })),
  setCurrentDir: (id) => set((state) => ({ fs: { ...state.fs, currentDir: id } })),
  setCurrentDirItems: (dirContents = "dirContents", currentFolderId = get().fs.currentDir) => {
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
    const dirObj = !!object
          ? {id, ...object}
          : {
            id,
            name,
            fsType: "folder",
            lastModified: getCurrentTimeStamp(),
            created: getCurrentTimeStamp(),
            origin: dirContents,
          };
    set((state) => ({
      fs: {
        ...state.fs,
        folders: {
          ...state.fs.folders,
          [id]: dirObj
        },
        [dirContents]: { ...state.fs.[dirContents], [id]: [], },
      },
    }));
    get().saveIdToDirContents(id, destId || get().fs.currentDir, dirContents);
    return dirObj;
  },
  touch: (item, destId, dirContents = "dirContents") => {
    console.log('destid', destId)
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
    get().setCurrentDirItems(dirContents);
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
    get().setCurrentDirItems(dirContents);
  },
});
