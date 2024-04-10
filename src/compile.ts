import data from './tpt/data.json';
import { tptRuntime } from './tpt/runtime';
import { tptEditors } from './tpt/editors';
import { tptUpgrade } from './tpt/upgrade';
import { transform } from './transform';

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
  originProjectJson: any,
  otherInfo?: any
): Promise<{}> {
  const projectJson = transform(originProjectJson)
  const { title, version, namespace, icon, fileId } = comInfo;
  const { serviceList, isPrivate, ...rest } = otherInfo || {};
  return new Promise<{}>((resolve) => {
    const { deps, inputs, outputs, pinRels } = Array.isArray(projectJson?.scenes) ? projectJson.scenes[0] : projectJson;
    // 保留
    const { coms = {} } = projectJson
    const reserveEditorsMap = {}
    Object.entries(coms).forEach(([key, value]: any) => {
      const { reservedEditorAry } = value
      if (reservedEditorAry) {
        reserveEditorsMap[value.id] = value
      }
    })

    const realInputs = inputs.filter((pin) => pin.type !== 'config');
    // 去除默认的点击加载等输出
    const relsOutputs: string[] = ['click', 'scroll', 'load', 'unload'];
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
      .replace('"--replace-title--"', `'${title}'`)
      .replace(`"__configs__"`, JSON.stringify(configs))
      .replace(`__fileId__`, fileId)
      .replace(`"__otherInfo__"`, JSON.stringify({ isPrivate, ...rest }))
      .replace(`"__outputs__"`, JSON.stringify(noRelOutputs))
      .replace(`"__reserveEditorsMap__"`, JSON.stringify(reserveEditorsMap));

    const allDeps =
      projectJson.deps ||
      [
        ...(projectJson?.scenes || []),
        ...(projectJson.modules
          ? Object.values(projectJson.modules).map((item) => item.json)
          : []),
      ].reduce(
        (pre, cur) => {
          pre.push(...cur.deps);
          return pre;
        },
        []
      );
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
      deps: allDeps
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
