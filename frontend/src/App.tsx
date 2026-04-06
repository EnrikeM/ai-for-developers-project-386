import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import {
  ActionIcon,
  AppShell,
  Avatar,
  Badge,
  Button,
  Card,
  Container,
  Box,
  Grid,
  Group,
  Paper,
  PasswordInput,
  SimpleGrid,
  Stack,
  Table,
  Tabs,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { IconArrowRight, IconCalendar, IconChevronLeft, IconChevronRight, IconLock, IconLogout } from '@tabler/icons-react';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import utc from 'dayjs/plugin/utc';
import { api, apiBaseUrl } from './lib/api';
import { getSession, signIn, signOut, type AuthSession } from './lib/auth';
import type { Booking, CalendarOwner, EventType, Slot } from './lib/types';
import { bookings as mockBookings, eventTypes as mockEventTypes, owner as mockOwner, slots as mockSlots } from './data/mock';

dayjs.locale('ru');
dayjs.extend(utc);

function formatRange(slot: Slot) {
  return `${dayjs(slot.startsAt).utc().format('HH:mm')} - ${dayjs(slot.endsAt).utc().format('HH:mm')}`;
}

function formatDateLabel(date: Date | null) {
  return date ? dayjs(date).locale('ru').format('dddd, D MMMM') : 'Время не выбрано';
}

function CalendarGrid({ month, selectedDate, onSelectDate, onMonthChange, slots }: { month: Date; selectedDate: Date | null; onSelectDate: (date: Date) => void; onMonthChange: (date: Date) => void; slots: Slot[] }) {
  const monthStart = dayjs(month).startOf('month');
  const startOffset = (monthStart.day() + 6) % 7;
  const startDate = monthStart.subtract(startOffset, 'day');
  const days = Array.from({ length: 42 }, (_, index) => startDate.add(index, 'day'));
  const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Group gap={8}>
          <ActionIcon variant="light" onClick={() => onMonthChange(dayjs(month).subtract(1, 'month').toDate())}>
            <IconChevronLeft size={16} />
          </ActionIcon>
          <ActionIcon variant="light" onClick={() => onMonthChange(dayjs(month).add(1, 'month').toDate())}>
            <IconChevronRight size={16} />
          </ActionIcon>
        </Group>
      </Group>

      <Text c="dimmed">{dayjs(month).locale('ru').format('MMMM YYYY')}</Text>

      <Grid columns={7} gutter={6}>
        {weekdays.map((weekday) => (
          <Grid.Col key={weekday} span={1}>
            <Text ta="center" c="dimmed" fz="sm" fw={600}>
              {weekday}
            </Text>
          </Grid.Col>
        ))}
        {days.map((date) => {
          const inMonth = date.month() === monthStart.month();
          const daySlots = slots.filter((slot) => dayjs(slot.startsAt).isSame(date.toDate(), 'day')).length;
          const active = selectedDate ? dayjs(selectedDate).isSame(date.toDate(), 'day') : false;

          return (
            <Grid.Col key={date.toISOString()} span={1}>
              <Paper
                withBorder
                radius="md"
                p={8}
                bg={active ? 'blue.1' : inMonth ? 'white' : 'gray.0'}
                onClick={() => onSelectDate(date.toDate())}
                style={{ cursor: 'pointer', minHeight: 54 }}
              >
                <Stack gap={2} align="center" justify="center" h="100%">
                  <Text c={inMonth ? 'dark' : 'dimmed'} fw={500}>
                    {date.date()}
                  </Text>
                  {daySlots > 0 ? <Text c="dimmed" fz="xs">{daySlots} св.</Text> : null}
                </Stack>
              </Paper>
            </Grid.Col>
          );
        })}
      </Grid>
    </Stack>
  );
}

function Header() {
  const location = useLocation();

  return (
    <Paper withBorder radius={0} px="xl" py="md">
      <Group justify="space-between" align="center">
        <Box component={Link} to="/">
          <Group gap="xs">
          <IconCalendar size={22} stroke={2.2} color="var(--mantine-color-orange-6)" />
          <Text fw={700}>Calendar</Text>
          </Group>
        </Box>
        <Group gap="xs" visibleFrom="sm">
          <Button variant={location.pathname === '/book' ? 'light' : 'subtle'} component={Link} to="/book">
            Записаться
          </Button>
          <Button variant={location.pathname === '/admin' ? 'light' : 'subtle'} component={Link} to="/admin">
            Админка
          </Button>
        </Group>
      </Group>
    </Paper>
  );
}

function LandingPage() {
  return (
    <Container size="xl" py="xl">
      <Grid gutter="xl" align="center" pt="xl">
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Stack gap="lg">
            <Badge variant="white" size="lg" radius="xl" c="gray.8">
              БЫСТРАЯ ЗАПИСЬ НА ЗВОНОК
            </Badge>
            <Title order={1} fz={{ base: 48, md: 72 }} lh={1}>
              Calendar
            </Title>
            <Text c="dimmed" fz="xl" maw={520}>
              Забронируйте встречу за минуту: выберите тип события и удобное время.
            </Text>
            <Button size="lg" radius="md" rightSection={<IconArrowRight size={18} />} component={Link} to="/book" w={170}>
              Записаться
            </Button>
          </Stack>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card withBorder radius="xl" p="xl" className="glass-card" shadow="sm">
            <Stack gap="md">
              <Title order={2} fz={28}>
                Возможности
              </Title>
              <Text c="dimmed">• Выбор типа события и удобного времени для встречи.</Text>
              <Text c="dimmed">• Быстрое бронирование с подтверждением и заметками.</Text>
              <Text c="dimmed">• Управление типами встреч и просмотр бронирований в админке.</Text>
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>
    </Container>
  );
}

function BookingPage() {
  const [eventTypes, setEventTypes] = useState<EventType[]>(mockEventTypes);
  const [selectedEventTypeId, setSelectedEventTypeId] = useState(mockEventTypes[0]?.id ?? '');
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date('2026-03-31T00:00:00.000Z'));
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date('2026-03-01T00:00:00.000Z'));
  const [owner, setOwner] = useState<CalendarOwner>(mockOwner);
  const [availableSlots, setAvailableSlots] = useState<Slot[]>(mockSlots[selectedEventTypeId] ?? []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedEventType = eventTypes.find((eventType) => eventType.id === selectedEventTypeId) ?? eventTypes[0];

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [ownerData, eventTypesData] = await Promise.all([api.ownerProfile(), api.publicEventTypes()]);
        if (!active) return;
        setOwner(ownerData);
        setEventTypes(eventTypesData);
        setSelectedEventTypeId((current) => current || eventTypesData[0]?.id || '');
      } catch {
        setOwner(mockOwner);
        setEventTypes(mockEventTypes);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadSlots() {
      if (!selectedEventTypeId) return;
      try {
        const response = await api.publicSlots(selectedEventTypeId);
        if (!active) return;
        setAvailableSlots(response.items);
      } catch {
        setAvailableSlots(mockSlots[selectedEventTypeId] ?? []);
      }
    }

    loadSlots();

    return () => {
      active = false;
    };
  }, [selectedEventTypeId]);

  const visibleSlots = useMemo(
    () => (selectedDate ? availableSlots.filter((slot) => dayjs(slot.startsAt).isSame(selectedDate, 'day')) : availableSlots),
    [availableSlots, selectedDate],
  );

  return (
    <Container size="xl" py="xl">
      <Title order={1} mb="xl">
        Выберите тип события
      </Title>
      <Grid gutter="lg">
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card withBorder radius="xl" p="lg" h="100%">
            <Group align="flex-start" justify="space-between" mb="md">
              <Group align="center">
                <Avatar radius="xl" size={64} color="teal">
                  {owner.displayName[0]}
                </Avatar>
                <Stack gap={0}>
                  <Text fw={700} fz="lg">
                    {owner.displayName}
                  </Text>
                  <Text c="dimmed" fz="sm">
                    Host
                  </Text>
                </Stack>
              </Group>
              {selectedEventType ? <Badge variant="light">{selectedEventType.durationMinutes} мин</Badge> : null}
            </Group>

            <Stack gap="md">
              <Stack gap={4}>
                <Title order={3} fz={26}>
                  {selectedEventType?.name ?? 'Выберите тип встречи'}
                </Title>
                <Text c="dimmed">{selectedEventType?.description ?? 'Нажмите на карточку ниже.'}</Text>
              </Stack>

              <SimpleGrid cols={1} spacing="sm">
                {eventTypes.map((eventType) => (
                  <Button
                    key={eventType.id}
                    variant={eventType.id === selectedEventTypeId ? 'filled' : 'light'}
                    radius="md"
                    onClick={() => {
                      setSelectedEventTypeId(eventType.id);
                      setSelectedSlotId('');
                    }}
                  >
                    {eventType.name}
                  </Button>
                ))}
              </SimpleGrid>

              <Paper withBorder p="md" radius="lg" bg="blue.0">
                <Text c="dimmed" fz="sm">
                  Выбранная дата
                </Text>
                <Text fw={600}>{formatDateLabel(selectedDate)}</Text>
              </Paper>

              <Paper withBorder p="md" radius="lg" bg="blue.0">
                <Text c="dimmed" fz="sm">
                  Выбранное время
                </Text>
                <Text fw={600}>{selectedSlotId ? formatRange(availableSlots.find((slot) => slot.id === selectedSlotId) ?? availableSlots[0]!) : 'Время не выбрано'}</Text>
              </Paper>
            </Stack>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 5 }}>
          <Card withBorder radius="xl" p="lg" h="100%">
            <Group justify="space-between" mb="md">
              <Title order={3}>Календарь</Title>
              <Group gap={8}>
                <ActionIcon variant="light" onClick={() => setSelectedMonth(dayjs(selectedMonth).subtract(1, 'month').toDate())}>
                  <IconChevronLeft size={16} />
                </ActionIcon>
                <ActionIcon variant="light" onClick={() => setSelectedMonth(dayjs(selectedMonth).add(1, 'month').toDate())}>
                  <IconChevronRight size={16} />
                </ActionIcon>
              </Group>
            </Group>
            <Text c="dimmed" mb="md">
              {dayjs(selectedMonth).locale('ru').format('MMMM YYYY')}
            </Text>
            <CalendarGrid month={selectedMonth} selectedDate={selectedDate} onSelectDate={setSelectedDate} onMonthChange={setSelectedMonth} slots={availableSlots} />
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 3 }}>
          <Card withBorder radius="xl" p="lg" h="100%">
            <Title order={3} mb="md">
              Статус слотов
            </Title>
            <Stack gap="sm" mah={520} style={{ overflow: 'auto' }}>
              {(visibleSlots.length ? visibleSlots : availableSlots).map((slot, index) => {
                const booked = index < 3;
                return (
                  <Paper
                    key={slot.id}
                    withBorder
                    radius="lg"
                    p="md"
                    bg={booked ? 'gray.0' : selectedSlotId === slot.id ? 'blue.0' : 'white'}
                    onClick={() => !booked && setSelectedSlotId(slot.id)}
                    style={{ cursor: booked ? 'default' : 'pointer' }}
                  >
                    <Group justify="space-between">
                      <Text fw={500}>{formatRange(slot)}</Text>
                      <Badge variant={booked ? 'filled' : 'light'} color={booked ? 'gray' : 'green'}>
                        {booked ? 'Занято' : 'Свободно'}
                      </Badge>
                    </Group>
                  </Paper>
                );
              })}
            </Stack>

            <Group mt="lg" grow>
              <Button variant="default" component={Link} to="/">
                Назад
              </Button>
              <Button disabled={!selectedSlotId}>Продолжить</Button>
            </Group>
          </Card>
        </Grid.Col>
      </Grid>
    </Container>
  );
}

function AdminLogin({ onSuccess }: { onSuccess: (session: AuthSession) => void }) {
  const [username, setUsername] = useState('host');
  const [password, setPassword] = useState('host123');
  const [error, setError] = useState<string | null>(null);

  return (
    <Container size="xs" py="xl">
      <Card withBorder radius="xl" p="xl">
        <Stack gap="md">
          <Group justify="center">
            <Avatar radius="xl" size={56} color="orange">
              <IconLock size={24} />
            </Avatar>
          </Group>
          <Title order={2} ta="center">
            Вход в админку
          </Title>
          <Text c="dimmed" ta="center">
            Используйте `host` / `host123`.
          </Text>
          <TextInput label="Логин" value={username} onChange={(event) => setUsername(event.currentTarget.value)} />
          <PasswordInput label="Пароль" value={password} onChange={(event) => setPassword(event.currentTarget.value)} />
          {error ? <Text c="red" fz="sm">{error}</Text> : null}
          <Button
            onClick={() => {
              const ok = signIn(username, password);
              if (!ok) {
                setError('Неверный логин или пароль');
                return;
              }
              setError(null);
              onSuccess({ username, grantedAt: new Date().toISOString() });
            }}
          >
            Войти
          </Button>
        </Stack>
      </Card>
    </Container>
  );
}

function AdminDashboard({ session, onLogout }: { session: AuthSession; onLogout: () => void }) {
  const [owner, setOwner] = useState<CalendarOwner>(mockOwner);
  const [eventTypes, setEventTypes] = useState<EventType[]>(mockEventTypes);
  const [bookings, setBookings] = useState<Booking[]>(mockBookings);
  const [form, setForm] = useState<EventType>({ id: '', name: '', description: '', durationMinutes: 30 });
  const [notice, setNotice] = useState<string | null>(null);
  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [ownerData, eventTypesData, bookingsData] = await Promise.all([
          api.ownerProfile(),
          api.ownerEventTypes(),
          api.ownerBookings(),
        ]);
        if (!active) return;
        setOwner(ownerData);
        setEventTypes(eventTypesData);
        setBookings(bookingsData);
      } catch {
        setOwner(mockOwner);
        setEventTypes(mockEventTypes);
        setBookings(mockBookings);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  return (
    <Container size="xl" py="xl">
      <Group justify="space-between" mb="xl">
        <Stack gap={2}>
          <Title order={1}>Админка</Title>
          <Text c="dimmed">{owner.displayName} · {session.username}</Text>
        </Stack>
        <Button
          variant="default"
          leftSection={<IconLogout size={16} />}
          onClick={() => {
            signOut();
            onLogout();
          }}
        >
          Выйти
        </Button>
      </Group>

      <Grid gutter="lg">
        <Grid.Col span={{ base: 12, md: 5 }}>
          <Card withBorder radius="xl" p="lg">
            <Title order={3} mb="md">
              Создать тип встречи
            </Title>
            <Stack gap="sm">
              <TextInput
                label="Название"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.currentTarget.value }))}
              />
              <TextInput
                label="Описание"
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.currentTarget.value }))}
              />
              <TextInput
                label="Длительность, минут"
                type="number"
                value={form.durationMinutes}
                onChange={(event) => setForm((current) => ({ ...current, durationMinutes: Number(event.currentTarget.value) }))}
              />
              {notice ? <Text c="green" fz="sm">{notice}</Text> : null}
              <Button
                onClick={async () => {
                  const payload: EventType = {
                    id: form.id || crypto.randomUUID(),
                    name: form.name,
                    description: form.description,
                    durationMinutes: form.durationMinutes,
                  };
                  try {
                    const created = await api.ownerCreateEventType(payload);
                    setEventTypes((current) => [...current, created]);
                    setNotice('Тип встречи создан');
                  } catch {
                    setEventTypes((current) => [...current, payload]);
                    setNotice('Тип встречи создан локально');
                  }
                }}
              >
                Сохранить
              </Button>
            </Stack>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 7 }}>
          <Card withBorder radius="xl" p="lg">
            <Tabs defaultValue="event-types">
              <Tabs.List>
                <Tabs.Tab value="event-types">Типы встреч</Tabs.Tab>
                <Tabs.Tab value="bookings">Бронирования</Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="event-types" pt="md">
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Название</Table.Th>
                      <Table.Th>Мин</Table.Th>
                      <Table.Th>Описание</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {eventTypes.map((eventType) => (
                      <Table.Tr key={eventType.id}>
                        <Table.Td>{eventType.name}</Table.Td>
                        <Table.Td>{eventType.durationMinutes}</Table.Td>
                        <Table.Td>{eventType.description}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Tabs.Panel>

              <Tabs.Panel value="bookings" pt="md">
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Слот</Table.Th>
                      <Table.Th>Старт</Table.Th>
                      <Table.Th>Финиш</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {bookings.map((booking) => (
                      <Table.Tr key={booking.id}>
                        <Table.Td>{booking.slotId}</Table.Td>
                        <Table.Td>{dayjs(booking.startsAt).utc().format('DD.MM.YYYY HH:mm')}</Table.Td>
                        <Table.Td>{dayjs(booking.endsAt).utc().format('DD.MM.YYYY HH:mm')}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Tabs.Panel>
            </Tabs>
          </Card>
        </Grid.Col>
      </Grid>
    </Container>
  );
}

function AdminPage() {
  const [session, setSession] = useState<AuthSession | null>(() => getSession());

  if (!session) {
    return <AdminLogin onSuccess={setSession} />;
  }

  return <AdminDashboard session={session} onLogout={() => setSession(null)} />;
}

export default function App() {
  return (
    <AppShell header={{ height: 60 }} padding={0}>
      <AppShell.Header>
        <Header />
      </AppShell.Header>
      <AppShell.Main>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/book" element={<BookingPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell.Main>
    </AppShell>
  );
}
