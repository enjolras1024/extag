// src/core/template/drivers/driveClasses.js

import ClassBinding from 'src/core/bindings/ClassBinding'

export default function driveClasses(target, scopes, classes) {
  ClassBinding.create(classes).connect('class', target, scopes);
}