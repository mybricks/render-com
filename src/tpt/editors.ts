export function tptEditors() {
  return function () {
    const configs: any = "__configs__";
    const fileId = "__fileId__";
    const outputs: any = "__outputs__";
    const isPrivate: any = "__isPrivate__";
    return {
      '@init'({ style }) {
        style.width = '100%';
        style.height = 'auto';
      },
      '@resize': {
        options: ['width', 'height']
      },
      ':root': ({}, cate1, cate2) => {
        cate1.title = '常规';
        cate1.items = [
          ...(configs || []).map((cfg) => {
            const { id, extValues } = cfg;
            const { options, customIfVisible, customEditorValue } =
              extValues || {};
            const temp: any = {
              title: cfg.title,
              type: extValues.edtType,
              value: {
                get({ data }) {
                  const val = data.configs[id];
                  if (val !== void 0) {
                    return val;
                  } else {
                    return extValues.defaultValue;
                  }
                },
                set({ data }, val) {
                  data.configs[id] = val;
                  data.comRef.current.inputs[id](val);
                }
              }
            };
            if (options && typeof options === 'object') {
              temp.options = options;
            }
            if (options && typeof options === 'string') {
              temp.options = new Function(
                decodeURIComponent(options).replace(
                  /export\s+default/,
                  'return'
                )
              )();
            }
            if (customIfVisible && typeof customIfVisible === 'string') {
              temp.ifVisible = new Function(
                decodeURIComponent(customIfVisible).replace(
                  /export\s+default/,
                  'return'
                )
              )();
            }
            if (customEditorValue && typeof customEditorValue === 'string') {
              temp.value = new Function(
                decodeURIComponent(customEditorValue).replace(
                  /export\s+default/,
                  'return'
                )
              )();
            }
            return temp;
          }),
          {
            title: '事件',
            ifVisible() {
              return !!outputs.length;
            },
            items: [
              ...outputs.map((cfg) => {
                return {
                  title: cfg.title,
                  type: '_Event',
                  options: () => {
                    return {
                      outputId: cfg.id
                    };
                  }
                };
              })
            ]
          }
        ];

        if (isPrivate !== true) {
          cate2.title = '高级';
          cate2.items = [
            {
              title: '打开云组件搭建页面',
              type: 'Button',
              value: {
                set() {
                  window.open(
                    `/page/application/cdm/pc?fileId=${fileId}`,
                    `cdm-${fileId}`
                  );
                }
              }
            }
          ];
        }
      }
    };
  };
}
