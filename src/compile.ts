import data from './tpt/data.json';
import { tptRuntime } from './tpt/runtime';
import { tptEditors } from './tpt/editors';
import { tptUpgrade } from './tpt/upgrade';

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
  icon?: string;
}
interface ComJsonProps {
  namespace: string;
  title: string;
  version: string;
  data: any;
  runtime: string;
  editors: string;
  upgrade?: string;
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
  icon?: string;
  deps: { namespace: string; version: string }[];
}
export async function compile(
  comInfo: ComInfo,
  projectJson: any,
  otherInfo?: any
): Promise<{}> {
  const { title, version, namespace, icon, fileId } = comInfo;
  const { serviceList, isPrivate, ...rest } = otherInfo || {};
  return new Promise<{}>((resolve) => {
    const { deps, inputs, outputs, pinRels } = Array.isArray(projectJson?.scenes) ? projectJson.scenes[0] : projectJson;
    // 保留
    const { coms } = projectJson
    const reserveEditorsMap = {}
    Object.entries(coms).forEach(([key, value]: any) => {
      const { reservedEditorAry } = value
      if (reservedEditorAry) {
        reserveEditorsMap[value.id] = value
      }
    })
    // 保留

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
    tptRT = tptRT
      .replace(`"__json__"`, JSON.stringify(projectJson))
      .replace(`"__serviceList__"`, JSON.stringify(serviceList || []));

    //---edit-----------------------------------------
    let tptEdt = formatTpl(tptEditors.toString());
    tptEdt = tptEdt
      .replace(`"__configs__"`, JSON.stringify(configs))
      .replace(`__fileId__`, fileId)
      .replace(`"__otherInfo__"`, JSON.stringify({ isPrivate, ...rest }))
      .replace(`"__outputs__"`, JSON.stringify(noRelOutputs))
      .replace(`"__reserveEditorsMap__"`, JSON.stringify(reserveEditorsMap));

    //---comjson-----------------------------------------
    const comDef: ComJsonProps = {
      namespace,
      title,
      data,
      version,
      icon,
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

    //---upgrade-----------------------------------------
    let tptUpg = formatTpl(tptUpgrade.toString());
    tptUpg = tptUpg
      .replace(`"__inputs__"`, JSON.stringify(comDef.inputs))
      .replace(`"__outputs__"`, JSON.stringify(comDef.outputs))
      .replace(`"__data__"`, JSON.stringify(comDef.data));
    comDef.upgrade = tptUpg;

    resolve(comDef);
  });
}
