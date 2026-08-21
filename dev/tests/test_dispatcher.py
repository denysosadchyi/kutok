import importlib.util
import subprocess
import tempfile
import unittest
from pathlib import Path
from unittest import mock


DISPATCHER_PATH = Path('/home/den/.local/share/kutok-dispatcher/dispatcher.py')
SPEC = importlib.util.spec_from_file_location('kutok_dispatcher', DISPATCHER_PATH)
dispatcher = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(dispatcher)


class ExecutorRoutingTest(unittest.TestCase):
    def test_complexity_table_uses_content_and_structured_fields_not_length(self):
        cases = (
            (
                'normal',
                {
                    'comment': 'випадаючі списки треба пропрацювати. щоби не були системні випадашки, а все в дизайні',
                    'element': 'select',
                    'url': 'http://192.168.31.212:8901/wireframes/listings.html',
                },
                False,
            ),
            (
                'complex',
                {
                    'comment': 'дровері відкривай макет без панелі навігації зліва',
                    'element': 'nav',
                    'url': 'http://192.168.31.212:8901/dev/fixlog.html',
                },
                False,
            ),
            ('small', {'comment': 'Вирівняй іконку на 2 px', 'severity': 'minor'}, False),
            ('complex', {'comment': 'Зміни IA навігації', 'severity': 'critical'}, False),
            ('normal', {'comment': 'Незрозуміле формулювання без сигналу складності'}, False),
            (
                'small',
                {'id': '12:00|/wireframes/listings.html', 'rework': {'note': 'прибери цей відступ'}},
                True,
            ),
            (
                'complex',
                {'id': '12:00|/wireframes/listings.html', 'rework': {'note': 'рефакторинг навігації'}},
                True,
            ),
            # Length alone must not upgrade a mechanical correction.
            ('small', {'comment': 'Вирівняй іконку. ' + ('контекст ' * 300)}, False),
            # Short Agentation corrections use the explicit small allowlist.
            ('small', {'comment': 'прибери бордер'}, False),
            ('small', {'comment': 'ще чуть більше скруглення'}, False),
            ('small', {'comment': 'це біля фільтра постав'}, False),
            ('small', {'comment': 'зроби скруглення менше'}, False),
            ('small', {'comment': 'сховай іконку'}, False),
            ('small', {'comment': 'зміни відступ на 16px'}, False),
            # Breadcrumbs on every page is an information-architecture task.
            ('complex', {'comment': 'треба показувати breadcrumbs на всіх сторінках'}, False),
            ('normal', {'comment': 'перероби компонент select'}, False),
        )
        for expected, payload, is_rework in cases:
            with self.subTest(expected=expected, payload=payload):
                self.assertEqual(
                    dispatcher.classify_work(payload, rework=is_rework),
                    expected,
                )

    def test_model_route_table_is_exact_and_closed(self):
        self.assertEqual(
            {
                key: (value.model, value.effort)
                for key, value in dispatcher.MODEL_ROUTES.items()
            },
            {
                'small': ('gpt-5.6-luna', 'low'),
                'normal': ('gpt-5.6-terra', 'medium'),
                'complex': ('gpt-5.6-sol', 'high'),
            },
        )
        with self.assertRaises(ValueError):
            dispatcher.model_route('gpt-5.6-sol --dangerously-bypass-approvals-and-sandbox')

    def test_legacy_and_allowlisted_queue_values(self):
        self.assertEqual(dispatcher.executor_of({'rework': {}}), 'codex')
        self.assertEqual(dispatcher.executor_of({'rework': {}}, 'claude'), 'claude')
        self.assertEqual(
            dispatcher.executor_of({'rework': {'executor': 'codex'}}),
            'codex',
        )
        with self.assertRaises(ValueError):
            dispatcher.executor_of({'rework': {'executor': 'bash'}})

    def test_server_backed_global_selection_is_allowlisted(self):
        with mock.patch.object(
            dispatcher, 'http_quiet', return_value={'executor': 'claude'}
        ):
            self.assertEqual(dispatcher.selected_executor(), 'claude')
        with mock.patch.object(dispatcher, 'http_quiet', return_value=None):
            self.assertEqual(dispatcher.selected_executor(), 'codex')
        with mock.patch.object(
            dispatcher, 'http_quiet', return_value={'executor': 'shell'}
        ), mock.patch.object(dispatcher, 'log'):
            self.assertEqual(dispatcher.selected_executor(), 'codex')

    def test_cli_argv_uses_verified_noninteractive_flags(self):
        claude = dispatcher.executor_command('claude', 'brief')
        self.assertEqual(
            claude,
            [dispatcher.CLAUDE, '-p', 'brief', '--dangerously-skip-permissions'],
        )

        codex = dispatcher.executor_command('codex', 'brief', 'small')
        self.assertEqual(
            codex,
            [
                dispatcher.CODEX, 'exec', '--approve-for-me', '--ephemeral',
                '--model', 'gpt-5.6-luna',
                '--config', 'model_reasoning_effort="low"',
                '--cd', dispatcher.REPO, 'brief',
            ],
        )
        self.assertNotIn('--sandbox', codex)
        self.assertNotIn('--dangerously-bypass-approvals-and-sandbox', codex)
        with self.assertRaises(ValueError):
            dispatcher.executor_command('codex', 'brief', '--model evil')

    def test_codex_parser_rejects_conflict_and_accepts_actual_flag_set(self):
        missing_cwd = '/definitely/missing/kutok-codex-parser-test'
        conflict = subprocess.run(
            [dispatcher.CODEX, 'exec', '--approve-for-me', '--sandbox',
             'workspace-write', '--ephemeral', '--cd', missing_cwd, 'brief'],
            stdin=subprocess.DEVNULL,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=10,
            check=False,
        )
        self.assertEqual(conflict.returncode, 2)
        self.assertRegex(conflict.stderr, r'(?i)(conflict|cannot be used)')

        valid = subprocess.run(
            [dispatcher.CODEX, 'exec', '--approve-for-me', '--ephemeral',
             '--model', 'gpt-5.6-luna', '--config',
             'model_reasoning_effort="low"', '--cd', missing_cwd, 'brief'],
            stdin=subprocess.DEVNULL,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=10,
            check=False,
        )
        # Missing cwd stops before any model call. Exit 2 is clap/parser
        # rejection, so any other non-zero code proves the flags parsed.
        self.assertNotEqual(valid.returncode, 2, valid.stderr)
        self.assertRegex(valid.stderr, r'(?i)(no such file|does not exist|directory)')

    def test_worker_subprocess_is_mocked_and_never_uses_a_shell(self):
        fake_process = mock.Mock(pid=4242)
        with tempfile.TemporaryDirectory() as run_dir, \
             mock.patch.object(dispatcher, 'RUNS_DIR', run_dir), \
             mock.patch.object(dispatcher.subprocess, 'Popen', return_value=fake_process) as popen:
            worker = dispatcher.Worker(
                'rework', '12:00|/route', 'label', 'brief', executor='codex',
                complexity='complex',
            )
            try:
                args, kwargs = popen.call_args
                self.assertEqual(
                    args[0], dispatcher.executor_command('codex', 'brief', 'complex')
                )
                self.assertEqual(worker.model, 'gpt-5.6-sol')
                self.assertEqual(worker.effort, 'high')
                self.assertEqual(worker.lane, 'Codex · gpt-5.6-sol · high')
                self.assertNotIn('shell', kwargs)
                self.assertTrue(kwargs['start_new_session'])
            finally:
                worker.close()

    def test_timeout_fixlog_uses_selected_model_lane(self):
        state = {'rework_dispatched': {}, 'timeouts': {}, 'done_sigs': {}}
        with mock.patch.object(dispatcher, 'save_state'), \
             mock.patch.object(dispatcher, 'append_fixlog_row') as append:
            dispatcher.report_stop(
                state, '12:00|/route', 'rework', '/route', 'request', 1.5,
                '/tmp/mock.log', 'timeout', 'Codex · gpt-5.6-sol · high',
            )
        self.assertEqual(append.call_args.args[0][4], 'Codex · gpt-5.6-sol · high')

    def test_queue_executor_reaches_worker_without_spawning(self):
        item = {
            'id': '12:00|/wireframes/listings.html',
            'rework': {'note': 'Виправ', 'executor': 'codex'},
        }
        state = {'rework_dispatched': {}, 'timeouts': {}, 'done_sigs': {}}
        workers = []

        class FakeWorker:
            def __init__(self, *args, **kwargs):
                self.executor = kwargs['executor']
                self.complexity = kwargs['complexity']
                self.proc = mock.Mock(pid=9191)
                self.log_path = '/isolated/mock-run.log'

        with mock.patch.object(dispatcher, 'http_quiet', return_value={'items': [item]}), \
             mock.patch.object(dispatcher, 'save_state'), \
             mock.patch.object(dispatcher, 'log'), \
             mock.patch.object(dispatcher, 'Worker', FakeWorker):
            dispatcher.take_reworks(state, workers)

        self.assertEqual(len(workers), 1)
        self.assertEqual(workers[0].executor, 'codex')
        self.assertEqual(workers[0].complexity, 'normal')
        self.assertIn(item['id'], state['rework_dispatched'])

    def test_global_executor_reaches_new_annotation_without_spawning(self):
        annotation = {
            'id': 'ann-1',
            'url': 'http://localhost/wireframes/listings.html',
            'comment': 'Виправ',
        }
        state = {'rework_dispatched': {}, 'timeouts': {}, 'done_sigs': {}}
        workers = []

        class FakeWorker:
            def __init__(self, *args, **kwargs):
                self.executor = kwargs['executor']
                self.complexity = kwargs['complexity']
                self.proc = mock.Mock(pid=8181)
                self.log_path = '/isolated/mock-annotation.log'
                self.sig = args[6]

        def fake_http(method, url, payload=None):
            self.assertEqual(method, 'PATCH')
            self.assertEqual(payload, {'status': 'acknowledged'})
            return {}

        with mock.patch.object(
            dispatcher, 'http_quiet', return_value={'annotations': [annotation]}
        ), mock.patch.object(dispatcher, 'http', side_effect=fake_http), \
             mock.patch.object(dispatcher, 'log'), \
             mock.patch.object(dispatcher, 'Worker', FakeWorker):
            dispatcher.take_annotations(state, workers, 'codex')

        self.assertEqual(len(workers), 1)
        self.assertEqual(workers[0].executor, 'codex')
        self.assertEqual(workers[0].complexity, 'normal')

    def test_small_brief_is_task_scoped_and_bounded(self):
        annotation = {
            'id': 'ann-small',
            'url': 'http://localhost/wireframes/listings.html',
            'comment': 'Вирівняй іконку на 2 px',
            'element': 'span',
            'elementPath': 'main > article > button > span.icon',
            'cssClasses': 'icon listing-action__icon',
            # This large, unrelated browser dump must not enter the prompt.
            'computedStyles': {'all': 'x' * 20000},
            'fullPath': 'x' * 20000,
            'nearbyText': 'локальний контекст ' + ('x' * 20000),
            'intent': 'cosmetic',
            'severity': 'minor',
        }
        brief = dispatcher.annotation_brief(annotation, 'codex', 'small')
        self.assertLess(len(brief), 2500)
        self.assertIn('Вирівняй іконку на 2 px', brief)
        self.assertIn('/wireframes/listings.html', brief)
        self.assertIn('main > article > button > span.icon', brief)
        self.assertIn('gpt-5.6-luna', brief)
        self.assertNotIn('computedStyles', brief)
        self.assertNotIn('fullPath', brief)
        self.assertNotIn('intent', brief)
        self.assertNotIn('severity', brief)
        self.assertNotIn('x' * 601, brief)
        self.assertNotIn('gallery', brief.lower())
        self.assertNotIn('chat', brief.lower())
        self.assertNotIn('form', brief.lower())
        self.assertNotIn('docs/', brief.lower())
        self.assertIn('не роби repo-wide audit', brief)
        self.assertIn('лише target hints та безпосередні imports/usages', brief)
        self.assertIn('локального acceptance check', brief)
        self.assertNotIn('design-system/components/build.sh', brief)

    def test_small_shared_css_build_is_conditional(self):
        annotation = {
            'id': 'ann-small-shared',
            'url': 'http://localhost/wireframes/listings.html',
            'comment': 'Вирівняй select',
            'element': 'select',
            'elementPath': 'main .select',
            'cssClasses': 'select',
            'severity': 'minor',
        }
        brief = dispatcher.annotation_brief(annotation, 'codex', 'small')
        self.assertIn('лише якщо фактично змінено', brief)
        self.assertIn('shared `design-system/components/*.css`', brief)

    def test_skill_routing_is_scoped_by_complexity_and_frontend(self):
        cases = (
            ('small', {'id': 'skill-small', 'url': 'http://localhost/wireframes/listings.html', 'comment': 'Вирівняй іконку'},
             'design skills і дизайн-аудит не потрібні.', ('impeccable', 'design-taste-frontend')),
            ('normal', {'id': 'skill-normal', 'url': 'http://localhost/wireframes/listings.html', 'comment': 'перероби компонент select'},
             'skill `impeccable`', ('design-taste-frontend',)),
            ('complex', {'id': 'skill-complex', 'url': 'http://localhost/wireframes/listings.html', 'comment': 'зміни IA навігації'},
             'skills `impeccable` і `design-taste-frontend`', ()),
            ('complex', {'id': 'skill-nonfrontend', 'url': 'http://localhost/docs/architecture.md', 'comment': 'зміни IA навігації'},
             None, ('impeccable', 'design-taste-frontend')),
        )
        for complexity, annotation, required, absent in cases:
            with self.subTest(complexity=complexity, url=annotation['url']):
                brief = dispatcher.annotation_brief(annotation, 'codex', complexity)
                if required:
                    self.assertIn(required, brief)
                for skill in absent:
                    self.assertNotIn(skill, brief)

    def test_target_hints_are_repo_bounded_and_component_specific(self):
        hints = dispatcher.target_hints({
            'url': 'http://localhost/wireframes/listings.html',
            'element': 'select',
            'elementPath': 'main .select',
            'cssClasses': 'select',
        })
        self.assertIn('wireframes/listings.html', hints)
        self.assertIn('design-system/components/select.css', hints)
        self.assertLessEqual(len(hints), 4)
        self.assertEqual(
            dispatcher.target_hints({'url': 'http://localhost/../../etc/passwd'}),
            (),
        )


class WorkerCapacityAndReworkRetryTest(unittest.TestCase):
    class FakeWorker:
        serial = 0

        def __init__(self, kind, key, label, brief, route='?', request='', sig='', **kwargs):
            type(self).serial += 1
            self.kind = kind
            self.key = key
            self.label = label
            self.route = route
            self.request = request
            self.sig = sig
            self.executor = kwargs['executor']
            self.complexity = kwargs['complexity']
            self.lane = dispatcher.execution_lane(self.executor, self.complexity)
            self.proc = mock.Mock(pid=1000 + type(self).serial)
            self.log_path = f'/isolated/{key}.log'

    @staticmethod
    def state():
        return {'rework_dispatched': {}, 'timeouts': {}, 'done_sigs': {}}

    @staticmethod
    def annotation(index):
        return {
            'id': f'ann-{index}',
            'url': f'http://localhost/wireframes/listings-{index}.html',
            'comment': f'Виправ {index}',
        }

    @staticmethod
    def rework(rid='12:42|/wireframes/listings.html'):
        return {'id': rid, 'rework': {'note': 'Виправ зауваження', 'executor': 'codex'}}

    def test_pending_annotations_fill_exactly_four_and_never_exceed_cap(self):
        state = self.state()
        workers = []
        annotations = [self.annotation(i) for i in range(5)]
        with mock.patch.object(dispatcher, 'http_quiet', return_value={'annotations': annotations}), \
             mock.patch.object(dispatcher, 'http', return_value={}) as acknowledge, \
             mock.patch.object(dispatcher, 'log'), \
             mock.patch.object(dispatcher, 'Worker', self.FakeWorker):
            dispatcher.take_annotations(state, workers, 'codex')

        self.assertEqual(len(workers), dispatcher.MAX_WORKERS)
        self.assertEqual(len(acknowledge.call_args_list), dispatcher.MAX_WORKERS)
        self.assertEqual([worker.key for worker in workers], [f'ann-{i}' for i in range(4)])

    def test_rework_is_reserved_a_slot_before_many_annotations(self):
        state = self.state()
        workers = []
        rework = self.rework()
        annotations = [self.annotation(i) for i in range(4)]

        def fake_http_quiet(method, url, payload=None):
            if url.endswith('/rework'):
                return {'items': [rework]}
            if url.endswith('/pending'):
                return {'annotations': annotations}
            self.fail(f'unexpected URL: {url}')

        with mock.patch.object(dispatcher, 'http_quiet', side_effect=fake_http_quiet), \
             mock.patch.object(dispatcher, 'http', return_value={}), \
             mock.patch.object(dispatcher, 'save_state'), \
             mock.patch.object(dispatcher, 'log'), \
             mock.patch.object(dispatcher, 'Worker', self.FakeWorker):
            dispatcher.refill_workers(state, workers, 'codex')

        self.assertEqual(len(workers), dispatcher.MAX_WORKERS)
        self.assertEqual(workers[0].kind, 'rework')
        self.assertEqual(sum(worker.kind == 'rework' for worker in workers), 1)
        self.assertEqual(sum(worker.kind == 'annotation' for worker in workers), 3)

    def test_completed_worker_triggers_fast_refill_without_waiting_for_poll(self):
        state = self.state()

        class CompletedWorker:
            kind = 'annotation'
            key = 'done-ann'
            label = 'done annotation'
            route = '/wireframes/listings.html'
            request = 'done'
            sig = 'done-sig'
            lane = 'Codex · gpt-5.6-terra · medium'
            log_path = '/isolated/done.log'
            timed_out = False
            started = 0

            @staticmethod
            def poll():
                return 0

            @staticmethod
            def close():
                pass

        workers = [CompletedWorker()]
        replacement = self.FakeWorker('annotation', 'new-ann', 'new', 'brief', sig='new-sig',
                                      executor='codex', complexity='normal')
        with mock.patch.object(dispatcher, 'remember_sig'), \
             mock.patch.object(dispatcher, 'log'), \
             mock.patch.object(dispatcher, 'take_reworks') as take_reworks, \
             mock.patch.object(dispatcher, 'take_annotations', side_effect=lambda *args: args[1].append(replacement)):
            finished = dispatcher.reap(state, workers)
            self.assertTrue(dispatcher.refill_due(False, finished))
            dispatcher.refill_workers(state, workers, 'codex')

        self.assertEqual(finished, 1)
        self.assertEqual(workers, [replacement])
        self.assertEqual(dispatcher.loop_sleep_seconds(workers, next_queue_poll=999, now=0),
                         dispatcher.REFILL_SECONDS)
        self.assertLess(dispatcher.REFILL_SECONDS, dispatcher.POLL_SECONDS)
        take_reworks.assert_called_once()

    def test_failed_rework_retries_after_backoff_but_stops_at_max_attempts(self):
        state = self.state()
        rid = '12:42|/wireframes/listings.html'
        state['rework_dispatched'][rid] = {'attempts': 1, 'inflight': True, 'started_at': 10}
        with mock.patch.object(dispatcher, 'time') as mocked_time, \
             mock.patch.object(dispatcher, 'save_state'), \
             mock.patch.object(dispatcher, 'log'):
            mocked_time.time.return_value = 100
            dispatcher.schedule_rework_retry(state, rid, 'код 2')
            retry_at = state['rework_dispatched'][rid]['next_at']
            self.assertFalse(dispatcher.rework_ready(state['rework_dispatched'], rid, retry_at - 0.1)[0])
            self.assertTrue(dispatcher.rework_ready(state['rework_dispatched'], rid, retry_at)[0])

            state['rework_dispatched'][rid] = {'attempts': dispatcher.REWORK_MAX_ATTEMPTS,
                                                'inflight': True, 'started_at': 100}
            dispatcher.schedule_rework_retry(state, rid, 'код 2')

        self.assertTrue(state['rework_dispatched'][rid]['exhausted'])
        self.assertFalse(dispatcher.rework_ready(state['rework_dispatched'], rid, now=999999)[0])

    def test_zero_exit_without_rework_done_marker_is_retried(self):
        state = self.state()
        item = self.rework()
        worker = self.FakeWorker('rework', item['id'], 'redo', 'brief',
                                 executor='codex', complexity='normal')
        worker.started = 0
        worker.timed_out = False
        worker.poll = lambda: 0
        worker.close = lambda: None
        state['rework_dispatched'][item['id']] = {
            'attempts': 1, 'inflight': True, 'started_at': 0,
        }
        with mock.patch.object(dispatcher, 'http_quiet', return_value={'items': [item]}), \
             mock.patch.object(dispatcher, 'save_state'), \
             mock.patch.object(dispatcher, 'log'), \
             mock.patch.object(dispatcher, 'time') as mocked_time:
            mocked_time.time.return_value = 100
            dispatcher.reap(state, [worker])

        record = state['rework_dispatched'][item['id']]
        self.assertFalse(record['inflight'])
        self.assertEqual(record['attempts'], 1)
        self.assertEqual(record['next_at'], 100 + dispatcher.REWORK_RETRY_BASE_SECONDS)


if __name__ == '__main__':
    unittest.main()
