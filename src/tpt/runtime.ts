export function tptRuntime() {
  return function ({ env, data, inputs: myInputs, outputs: myOutputs }) {
    const React = window.React;
    if (
      !React ||
      typeof React !== 'object' ||
      !(typeof React.useMemo === 'function')
    ) {
      throw new Error(`window.React not found`);
    }
    const isPromise = (obj) => {
      return Promise.resolve(obj) === obj;
    }
    const { useMemo, useState, useEffect } = React;
    const json: any = "__json__";
    const serviceList: any = "__serviceList__";
    const ref = React.useRef();
    const [curCom, setCurCom] = useState(null)

    const r = useMemo(() => {
      return env.renderCom(json, {
        ref(refs) {
          if (!ref.current) {
            if (!data.subComponentData) {
              data.subComponentData = {}
            }
            ref.current = refs;
            // 触发外部更新
            data.comRef = {
              current: refs
            }
            const { inputs, outputs, pinRels } = Array.isArray(json?.scenes) ? json.scenes[0] : json;
            if (inputs) {
              const configInputs = inputs.filter(
                (pin) => pin.type === 'config'
              );
              configInputs.forEach((ipt) => {
                const curVal = data.configs[ipt.id];
                if (ref.current && curVal !== undefined) {
                  refs.inputs[ipt.id](curVal);
                }
              });

              const realInputs = inputs.filter(
                (pin) => pin.type !== 'config'
              );
              realInputs.forEach((ipt) => {
                const { id } = ipt;
                const fn = myInputs[id];
                if (typeof fn === 'function') {
                  fn((val, relOutputs) => {
                    pinRels?.[`_rootFrame_-${ipt.id}`]?.forEach(
                      (outputId) => {
                        refs.outputs(outputId, relOutputs[outputId]);
                      }
                    );
                    refs.inputs[ipt.id](val);
                  });
                } else if (myInputs.hasOwnProperty(id)) {
                  if (myInputs.hasOwnProperty(id)) {
                    refs.inputs[id](myInputs[id])
                    myInputs[id] = refs.inputs[id];
                  }
                }
              });
            }
            if (outputs) {
              outputs.forEach((opt) => {
                refs.outputs(opt.id, myOutputs[opt.id]);
              });
            }
            /**
             * 存储子组件配置的数据源
             */
            Object.entries(data.subComponentData).forEach(([key, value]) => {
              const data = refs.get(key).data
              Object.assign(data, value)
            })
          }
        },
        env: Object.assign({}, env, {
          callService: (id, params) => {
            const item = serviceList?.find?.((service) => {
              return service.id === id;
            });
            return env.callService(item, params);
          }
        })
      })
    }, []);

    useEffect(() => {
      if (isPromise(r)) {
        r.then(com => {
          setCurCom(com)
        })
      }
    }, [r])

    // 兼容renderCom是promise的用法
    return isPromise(r) ? curCom : r;
  };
}
