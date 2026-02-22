import type { default as ReplicacheClientGroupTable } from './ReplicacheClientGroup';
import type { default as LabelTable } from './Label';
import type { default as EmailVerificationTable } from './EmailVerification';
import type { default as ReplicacheClientViewTable } from './ReplicacheClientView';
import type { default as UserTable } from './User';
import type { default as ReplicacheClientTable } from './ReplicacheClient';
import type { default as UserSessionTable } from './UserSession';
import type { default as PointLabelTable } from './PointLabel';
import type { default as StreamTable } from './Stream';
import type { default as StatusTable } from './Status';
import type { default as MetaTaskTable } from './MetaTask';
import type { default as LabelParentTable } from './LabelParent';
import type { default as PointTable } from './Point';
import type { default as PointWithLabelListTable } from './PointWithLabelList';
import type { default as LineTable } from './Line';
import type { default as LabelWithParentListTable } from './LabelWithParentList';

export default interface PublicSchema {
  replicacheClientGroup: ReplicacheClientGroupTable;

  label: LabelTable;

  emailVerification: EmailVerificationTable;

  replicacheClientView: ReplicacheClientViewTable;

  user: UserTable;

  replicacheClient: ReplicacheClientTable;

  userSession: UserSessionTable;

  pointLabel: PointLabelTable;

  stream: StreamTable;

  status: StatusTable;

  metaTask: MetaTaskTable;

  labelParent: LabelParentTable;

  point: PointTable;

  pointWithLabelList: PointWithLabelListTable;

  line: LineTable;

  labelWithParentList: LabelWithParentListTable;
}