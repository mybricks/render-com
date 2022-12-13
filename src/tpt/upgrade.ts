export function tptUpgrade() {
  return function ({ data: myData, input: myInput, output: myOutput }) {
    const inputs: any = "__inputs__";
    const outputs: any = "__outputs__";
    const data: any = "__data__";

    outputs.forEach((pin) => {
      const { id, title, schema } = pin;
      if (!myOutput.get(id)) {
        myOutput.add(id, title, schema);
      } else {
        myOutput.get(id).setTitle(title);
        myOutput.get(id).setSchema(schema);
      }
    });

    inputs.forEach((pin) => {
      const { id, title, schema, rels } = pin;
      if (!myInput.get(id)) {
        myInput.add(id, title, schema);
      } else {
        myInput.get(id).setTitle(title);
        myInput.get(id).setSchema(schema);
      }
      if (Array.isArray(rels) && rels.length > 0) {
        const vRels: string[] = myInput.get(id).rels || [];
        if (vRels.join() !== rels.join()) {
          myInput.get(id).setRels(rels);
        }
      }
    });

    Object.keys(data?.configs || {}).forEach((key) => {
      if (myData?.configs?.[key] === undefined) {
        myData.configs[key] = data?.configs[key];
      }
    });

    return true;
  };
}
