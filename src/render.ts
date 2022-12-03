import {render as renderWeb} from '@mybricks/render-web'

export function render(json, opts) {
  opts.env.runtime = true

  return new Promise((resolve, reject) => {
    // const addComDef = designerRef.current.addComDef
    //
    // for (const nm in extDefs) {
    //   addComDef(extDefs[nm])
    // }
    //
    // const allComDef = designerRef.current.getAllComDef()

    const renderRst = renderWeb(json, Object.assign({
      env: {},
      //comDefs: allComDef,
      //observable
    }, opts || {}))

    resolve(renderRst)
  })
}