const formatDependencyMap = (data) => {
    let dataByObj = JSON.parse(JSON.stringify(data))


    function getChildren(obje) {
        let result = []
        for (let item in obje) {
            result.push({ "label": item + '@' + obje[item]})
        }
        return result
    }

    // 建立root
    let root = {}
    for (let item in dataByObj) {
        root["label"] = item
        // console.log(dataByObj[item].dependencies)
        root["children"] = getChildren(dataByObj[item].dependencies)
        // console.log(root)
        break;
    }

    // 建立完整的树
    for (let item in dataByObj) {
        if (item === root.label) {
            continue;
        }
        let existed_item = root.children.find(element => element.label === item)
        if (existed_item) {
            existed_item["children"] = getChildren(dataByObj[item].dependencies)
        } else {
            root.children.push({
                "label": item,
                "children": getChildren(dataByObj[item].dependencies)
            })
        }
    }
    return new Array(root);
}

export {
    formatDependencyMap
}