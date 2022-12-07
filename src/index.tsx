/**
 * MyBricks Opensource
 * https://mybricks.world
 * This source code is licensed under the MIT license.
 *
 * CheMingjun @2019
 * mybricks@126.com
 */
import pkg from '../package.json';

console.log(
  `%c ${pkg.name} %c@${pkg.version}`,
  `color:#FFF;background:#fa6400`
);

export { compile } from './compile';
export { render } from './render';
