const indexDB = window.indexedDB || window.webkitIndexedDB ||
  window.mozIndexedDB;

class IndexDBCache {
  constructor(callback) {
    this._db = null;
    this._transaction = null;
    this._request = null;
    this._cacheTableName = 'modalcache';
    this._dbversion = 1;
    this.initDB(callback);
  }
  initDB(callback) {
    this._request = indexDB.open('cacheModel', this._dbversion);
    this._request.onsuccess = event => {
      this._db = this._request.result;
      console.log('success db');
      if(typeof callback === 'function') callback();
    };
    this._request.onerror = event => {
      console.log('indexdb初始化失败');
      if(typeof callback === 'function') callback();
    };
    this._request.onupgradeneeded = event => {
      console.log('upgradeneeded')
      let db = this._request.result;
      // console.log('dfsdfs');
      let store = db.createObjectStore(this._cacheTableName, { keyPath: 'id' });
      store.createIndex("INDEX_ID", "id", { unique: true });
    }
  }
  loadNetSource(url) {
    return new Promise((resolve,reject)=>{
      fetch(url).then(res => {
        if(res.status === 200){
          res.blob().then(blob => {
            let transaction = this._db.transaction(this._cacheTableName, 'readwrite');
            let store = transaction.objectStore(this._cacheTableName);
            let storeReq = store.add({ id: url, blob });
            storeReq.onerror = event => {
              console.log('缓存失败');
              reject(url);
            }
            storeReq.onsuccess = event => {
              console.log(`创建${url}缓存成功`);
              resolve(blob);
            }
          })
        }else{
          console.log('未找到缓存资源');
          reject(url);
        }
        
      })
    })
    
  }
  cacheModel(url) {
    return new Promise((resolve,reject)=>{
      let transaction = this._db.transaction(this._cacheTableName, 'readwrite');
      let store = transaction.objectStore(this._cacheTableName);
      let response = store.get(url);
      response.onsuccess = e => {
        if(!response.result){
          this.loadNetSource(url).then(blob=>{
            let _url = URL.createObjectURL(blob);
            resolve(_url);
          }).catch(err=>{
            resolve(url);
          })
          return
        }
        let _url = URL.createObjectURL(response.result.blob);
        resolve(_url);
      }
      response.onerror = ()=>{
        resolve(url);
      }
    })
    
  }
  deleteModel(url){
    return new Promise((resolve,reject)=>{
      let transaction = this._db.transaction(this._cacheTableName, 'readwrite');
      let store = transaction.objectStore(this._cacheTableName);
      let response = store.get(url);
      response.onsuccess = ()=>{
        console.log('删除成功');
        resolve('删除成功');
      }
      response.onerror = (event)=>{
        console.log('删除失败');
        reject(event);
      }
    })
  }
}

export default IndexDBCache;
