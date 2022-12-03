export function tptRuntime() {
  return function ({env, data, inputs: myInputs, outputs: myOutputs}) {
    console.log(Math.random())

    const React = window.React || window.react
    const {useMemo, useEffect} = React

    if (!React || typeof React !== "object" || !(typeof React.useMemo === "function")) {
      throw new Error(`window.React not found`)
    }

    const json = useMemo(() => {
      return '__json__'
    }, [])

    const [r, setR] = React.useState(React.createElement("div", null, "\u52A0\u8F7D\u4E2D..."))
    const ref = React.useRef()

    useMemo(() => {
      env.renderCom(json, {
        ref(refs) {
          if (!ref.current) {
            ref.current = refs

            const {inputs, outputs} = json
            if (inputs) {
              const realInputs = inputs.filter(pin => pin.type !== 'config')
              realInputs.forEach(ipt => {
                myInputs[ipt.id](val => {
                  ref.current.inputs[ipt.id](val)
                })
              })
            }

            const configs = inputs.filter(pin => pin.type === 'config')
            configs.forEach(cfg => {
              const curVal = data.configs[cfg.id]
              if (ref.current) {
                ref.current.inputs[cfg.id](curVal)
              }
            })
          }
        },
        env: {}
      }).then(rst => {
        setR(rst)
      })
    }, [])

    return r
  }
}