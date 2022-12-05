import data from './tpt/data.json';
import { tptRuntime } from './tpt/runtime';
import { tptEditors } from './tpt/editors';

const formatTpl = (str) => {
  str = str.substring(str.indexOf(`return`) + 7, str.length - 1);
  if (str.match(/;\s*$/)) {
    //remove last ;
    str = str.substring(0, str.lastIndexOf(';'));
  }
  return str;
};
interface ComInfo {
  title: string;
  version: string;
  namespace: string;
  fileId: string;
}
interface ComJsonProps {
  namespace: string;
  title: string;
  version: string;
  data: any;
  runtime: string;
  editors: string;
  inputs: {
    id: string;
    title: string;
    schema: string;
    rels?: string[];
  }[];
  outputs: {
    id: string;
    title: string;
    schema: string;
  }[];
  deps: { namespace: string; version: string }[];
}
export async function compile(comInfo: ComInfo, projectJson): Promise<{}> {
  const { title, version, namespace, fileId } = comInfo;
  return new Promise<{}>((resolve) => {
    const { deps, inputs, outputs, pinRels } = projectJson;
    const realInputs = inputs.filter((pin) => pin.type !== 'config');
    const relsOutputs: string[] = [];
    realInputs.forEach((pin) => {
      relsOutputs.push(...(pinRels?.[`_rootFrame_-${pin.id}`] || []));
    });
    const noRelOutputs = outputs.filter((pin) => !relsOutputs.includes(pin.id));
    const configs = inputs.filter((pin) => pin.type === 'config');

    //---data----------------------------------------
    if (configs) {
      configs.forEach((cfg) => {
        data.configs[cfg.id] = cfg.extValues.defaultValue; //init value
      });
    }

    //---runtime-------------------------------------
    let tptRT = formatTpl(tptRuntime.toString());
    tptRT = tptRT.replace(`'__json__'`, JSON.stringify(projectJson));

    // const ueCode = []
    // if (configs) {
    //   configs.forEach(cfg => {
    //     ueCode.push(`
    //       React.useEffect(()=>{
    //         const curVal = data.configs['${cfg.id}']
    //         if(ref.current){
    //           ref.current.inputs['${cfg.id}'](curVal)
    //         }
    //       },[ref.current,data.configs['${cfg.id}']])
    //     `)
    //   })
    // }
    //
    // tptRT = tptRT.replaceAll(/['"]__ueCode__['"]/gi, ueCode.join(';'))

    //---edit-----------------------------------------
    let tptEdt = formatTpl(tptEditors.toString());
    tptEdt = tptEdt
      .replace(`'__configs__'`, JSON.stringify(configs))
      .replace('__fileId__', fileId)
      .replace(`'__outputs__'`, JSON.stringify(noRelOutputs));

    //console.log(tptRT)/////TODO 拆分成单独的包

    //---comjson-----------------------------------------
    const comDef: ComJsonProps = {
      namespace,
      title,
      data,
      version,
      runtime: tptRT,
      editors: tptEdt,
      inputs: [],
      outputs: [],
      deps
    };
    if (realInputs) {
      comDef.inputs = realInputs.map((ipt) => {
        return {
          id: ipt.id,
          title: ipt.title,
          schema: ipt.schema,
          rels: pinRels?.[`_rootFrame_-${ipt.id}`]
        };
      });
    }
    if (outputs) {
      comDef.outputs = outputs.map((opt) => {
        return {
          id: opt.id,
          title: opt.title,
          schema: opt.schema
        };
      });
    }

    resolve(comDef);
  });
}
