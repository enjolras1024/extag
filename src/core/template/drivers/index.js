import HTMXEngine from 'src/core/template/HTMXEngine'
// import { createContent } from './driveChildren'
import createContent from './createContent'
import driveChildren from './driveChildren'
import driveContent from './driveContent'
import transferProps from './transferProps'
import driveComponent from './driveComponent'

HTMXEngine.createContent = createContent;
HTMXEngine.driveChildren = driveChildren;
HTMXEngine.driveContent = driveContent;
HTMXEngine.driveComponent = driveComponent;
HTMXEngine.transferProps = transferProps;

export {
  driveComponent,
  transferProps,
  createContent,
  driveChildren,
  driveContent
}