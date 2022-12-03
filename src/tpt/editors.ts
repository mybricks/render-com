export function tptEditors() {
  return function () {
    const configs = '__configs__' as []

    return {
      ':root': configs.map(cfg => {
        const {id, extValues} = cfg
        return {
          title: cfg.title,
          type: extValues.edtType,
          value: {
            get({data}) {
              const val = data.configs[id]
              if (val !== void 0) {
                return val
              } else {
                return extValues.defaultValue
              }
            }, set({data}, val) {
              data.configs[id] = val
            }
          }
        }
      })
    }
  }
}