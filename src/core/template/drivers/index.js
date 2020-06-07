import HTMXEngine from 'src/core/template/HTMXEngine'
import { createContent } from './driveChildren'
import driveChildren from './driveChildren'
import driveProps from './driveProps'
import driveEvents from './driveEvents'
import transferProps from './transferProps'
import driveComponent from './driveComponent'

HTMXEngine.makeContent = createContent;
HTMXEngine.createContent = createContent;
HTMXEngine.driveChildren = driveChildren;
// HTMXEngine.driveContent = driveContent;
HTMXEngine.driveEvents = driveEvents;
HTMXEngine.driveProps = driveProps;
HTMXEngine.driveComponent = driveComponent;
HTMXEngine.transferProps = transferProps;
HTMXEngine.transferProperties = transferProps;

export {
  driveComponent,
  transferProps,
  createContent,
  driveChildren,
  // driveContent
}