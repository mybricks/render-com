import { render as renderWeb } from '@mybricks/render-web';

export function render(json, opts) {
  return renderWeb(json, {
    ...(opts || {}),
    env: {
      ...(opts?.env || {}),
      edit: false,
      runtime: true
    }
  });
}
