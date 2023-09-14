export function tptEditors() {
  return function () {
    const configs: any = "__configs__";
    const fileId = "__fileId__";
    const outputs: any = "__outputs__";
    const otherInfo: any = "__otherInfo__";
    const reserveEditorsMap: any = "__reserveEditorsMap__";

    const comDefs = {}

    function deepSearchComAray (comAray) {
      comAray.forEach((com) => {
        const { comAray } = com
        if (Array.isArray(comAray)) {
          deepSearchComAray(comAray)
        } else {
          const { namespace } = com
          comDefs[namespace] = com
        }
      })
    }

    deepSearchComAray(window['__comlibs_edit_'])

    const editors = {
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
              description: extValues.description,
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
                  data.comRef?.current?.inputs[id](val);
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

        if (!otherInfo?.isPrivate) {
          cate2.title = '高级';
          cate2.items = [
            {
              title: '打开云组件搭建页面',
              type: 'Button',
              value: {
                set() {
                  window.open(
                    `${otherInfo?.cdmUrlPrefix || '/page/application/cdm/pc?fileId='}${fileId}`,
                    `cdm-${fileId}`
                  );
                }
              }
            }
          ];
        }
      }
    };

    /**
     * 匹配对应的编辑器
     */
    function getEditor(config, match, obj: any = {}) {
      const type = toString.call(config);
      if (type === '[object Object]') {
        if (config.type) {
          if (config.id === match) {
            obj.res = config;
          }
        } else if (Array.isArray(config.items)) {
          getEditor(config.items, match, obj);
        } else if (typeof config.items === 'function') {
          const cate0 = {};
          const cate1 = {};
          const cate2 = {};
    
          config.items({}, cate0, cate1, cate2);
  
          [cate0, cate1, cate2].find(cate => getEditor(cate, match, obj));
        };
      } else if (type === '[object Array]') {
        config.find(config => getEditor(config, match, obj));
      } else if (type === '[object Function]') {
        const cate0 = {};
        const cate1 = {};
        const cate2 = {};
  
        config({}, cate0, cate1, cate2);
  
        [cate0, cate1, cate2].find(cate => getEditor(cate, match, obj));
      };
  
      return obj.res;
    };

    /**
     * 仅实现了子组件数据源的配置
     */
    Object.entries(reserveEditorsMap).forEach(([comId, { def, title, reservedEditorAry }]: any) => {
      const { namespace } = def
      Object.entries(reservedEditorAry).forEach(([selector, value]: any) => {
        const editorKey = `#${comId}${selector === ':root' ? '' : ` ${selector}`}`
        const items: any = []

        value.forEach(({ id }) => {
          const editor = getEditor(comDefs[namespace].editors[selector], id)

          items.push({
            ...editor,
            id: null,
            value: {
              get(props) {
                const data = props.data.comRef?.current?.get(comId).data
                props.data.subComponentData[comId] = data
                return editor.value.get({...props, slot: {}, data});
              },
              set(props, value) {
                editor.value.set({...props, slot: {}, data: props.data.comRef?.current?.get(comId).data}, value);
              }
            }
          })
        })

        editors[editorKey] = (props, cate0) => {
          cate0.title = title
          cate0.items = items
        }
      })
    })

    return editors
  };
}
