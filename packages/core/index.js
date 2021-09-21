const rmIdFromDirContents = (fs, itemId, containerId) =>
      fs.dirContents[containerId] = fs.dirContents[containerId].filter(x => x !== itemId)

const saveIdToDirContents = (fs, itemId, containerId) =>
    fs.dirContents[containerId] = [...fs.dirContents[containerId], itemId]

const rmFileFromFiles = (fs, itemId) =>
    fs.files = Object.fromEntries(Object.entries(fs.files).filter(([k,v]) => k !== itemId))

const rmDirFromDirs = (fs, itemId) =>
    fs.directories = Object.fromEntries(Object.entries(fs.directories).filter(([k,v]) => k !== itemId))

const rmDirFromDirContents = (fs, itemId) => {
    delete fs.dirContents[itemId]
    return fs
}
const selectDirContents = (fs, containerId) => {
    const ids = fs.dirContents[containerId]
    const files = ids.map(id => fs.files[id]).filter(Boolean)
    const dirs = ids.map(id => fs.directories[id]).filter(Boolean)
    return [...dirs, ...files]
}

const deleteItem = (fs, itemId) => {
    rmFileFromFiles(fs, itemId)
    rmDirFromDirs(fs, itemId)
    return fs
}
const deleteDirRecur = (fs, itemId) => {
    for (const uuid of fs.dirContents[itemId]) {
        rmFileFromFiles(fs, uuid)
        rmDirFromDirs(fs, uuid)
        if (!!fs.dirContents[uuid]) {
            deleteDirRecur(fs, uuid)
            rmDirFromDirContents(fs, uuid)
        }
    }
    return fs
}
export const deleteFsItem = (fs, itemId, containerId) => {
    if (Array.isArray(itemId)) {
        // TODO selection multiple items
   } else {
        if (!!fs.dirContents[itemId]) {
            deleteDirRecur(fs, itemId)
            rmDirFromDirs(fs, itemId)
            rmDirFromDirContents(fs, itemId)
            rmIdFromDirContents(fs, itemId, containerId)
            return Object.assign({}, fs)
        } else {
            rmIdFromDirContents(fs, itemId, containerId)
            deleteItem(fs, itemId)
            return Object.assign({}, fs)
        }
    }
}

export const moveFsItem = (fs, itemId, destId, containerId) => {
    rmIdFromDirContents(fs, itemId, containerId)
    saveIdToDirContents(fs, itemId, destId)
    return Object.assign({}, fs)
}

export const renameFsItem = (fs, itemId, name) => {
    let subj = fs.directories[itemId] || fs.files[itemId]
    subj.name = name
    return Object.assign({}, fs)
}

export const saveFsItem = (fs, item, containerId) => {
    fs.files = Object.assign(fs.files, {[item.id]:item})
    saveIdToDirContents(fs, item.id, containerId)
    return Object.assign({}, fs)
}
