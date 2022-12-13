export function tptRuntime() {
  return function ({ env, data, inputs: myInputs, outputs: myOutputs }) {
    const React = window.React;
    const { useMemo } = React;

    if (
      !React ||
      typeof React !== 'object' ||
      !(typeof React.useMemo === 'function')
    ) {
      throw new Error(`window.React not found`);
    }

    const json: any = "__json__";
    const serviceList: any = "__serviceList__";

    const [r, setR] = React.useState(
      React.createElement('div', null, '\u52A0\u8F7D\u4E2D...')
    );
    const ref = React.useRef();
    data.comRef = ref;

    useMemo(() => {
      env
        .renderCom(json, {
          ref(refs) {
            if (!ref.current) {
              ref.current = refs;
              const { inputs, outputs, pinRels } = json;
              if (inputs) {
                const realInputs = inputs.filter(
                  (pin) => pin.type !== 'config'
                );
                realInputs.forEach((ipt) => {
                  const fn = myInputs[ipt.id];
                  if (typeof fn === 'function') {
                    fn((val, relOutputs) => {
                      pinRels?.[`_rootFrame_-${ipt.id}`]?.forEach(
                        (outputId) => {
                          refs.outputs(outputId, relOutputs[outputId]);
                        }
                      );
                      refs.inputs[ipt.id](val);
                    });
                  }
                });
                const configInputs = inputs.filter(
                  (pin) => pin.type === 'config'
                );
                configInputs.forEach((ipt) => {
                  const curVal = data.configs[ipt.id];
                  if (ref.current && curVal !== undefined) {
                    refs.inputs[ipt.id](curVal);
                  }
                });
              }
              if (outputs) {
                outputs.forEach((opt) => {
                  refs.outputs(opt.id, myOutputs[opt.id]);
                });
              }
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
        .then((rst) => {
          setR(rst);
        });
    }, []);

    return r;
  };
}
