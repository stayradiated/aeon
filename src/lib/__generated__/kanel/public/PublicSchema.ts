import type { default as ReplicacheClientGroupTable } from './ReplicacheClientGroup.ts';
import type { default as LabelTable } from './Label.ts';
import type { default as EmailVerificationTable } from './EmailVerification.ts';
import type { default as ReplicacheClientViewTable } from './ReplicacheClientView.ts';
import type { default as UserTable } from './User.ts';
import type { default as ReplicacheClientTable } from './ReplicacheClient.ts';
import type { default as UserSessionTable } from './UserSession.ts';
import type { default as PointLabelTable } from './PointLabel.ts';
import type { default as StreamTable } from './Stream.ts';
import type { default as StatusTable } from './Status.ts';
import type { default as MetaTaskTable } from './MetaTask.ts';
import type { default as LabelParentTable } from './LabelParent.ts';
import type { default as PointTable } from './Point.ts';
import type { default as PointWithLabelListTable } from './PointWithLabelList.ts';
import type { default as LineTable } from './Line.ts';
import type { default as LabelWithParentListTable } from './LabelWithParentList.ts';

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