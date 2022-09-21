const formatDependencyMap = (data, rootLabel) => {
    let dataByObj = JSON.parse(JSON.stringify(data))
    // 建立root
    let root = {}
    let childrenMap = {}

    function getChildren(label) {
        if(childrenMap[label]) return childrenMap[label];
        let result = []
        for (let item in dataByObj[label].dependencies) {
            let l = item + '@' + dataByObj[label].dependencies[item]
            result.push({ "label": l, "children": getChildren(l)})
        }
        childrenMap[label] = result
        return result
    }

    root['label'] = rootLabel;
    root['children'] = getChildren(rootLabel)

    return new Array(root);
}

export {
    formatDependencyMap
}