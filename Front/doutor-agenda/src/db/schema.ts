import { relations } from "drizzle-orm";
import {
  integer,
  pgEnum,
  pgTable,
  text,
  time,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(), //o "id" (entre aspas) é o nome da coluna !
});

export const usersTableRelations = relations(usersTable, ({ many }) => ({
  usersToClinics: many(usersToClinicsTable),
}));

export const usersToClinicsTable = pgTable("users_to_clinics", {
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id),
  clinicId: uuid("clinic_id")
    .notNull()
    .references(() => clinicsTable.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const usersToClinicsTableRelations = relations(
  usersToClinicsTable,
  ({ one }) => ({
    user: one(usersTable, {
      fields: [usersToClinicsTable.userId],
      references: [usersTable.id],
    }),
    clinic: one(clinicsTable, {
      fields: [usersToClinicsTable.clinicId],
      references: [clinicsTable.id],
    }),
  }),
);

export const clinicsTable = pgTable("clinics", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const clinicsTableRelations = relations(clinicsTable, ({ many }) => {
  return {
    doctors: many(doctorsTable),
    patients: many(patientsTable),
    appointments: many(appointmentsTable),
    usersToClinics: many(usersToClinicsTable),
  };
});

export const doctorsTable = pgTable("doctors", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  avatarImageUrl: text("avatar_image_url"), // Atributo para salvar a foto do user.
  speciality: text("speciality").notNull(), // Ex.: Cardiologista, Pediatra, ...
  appointmentPriceInCents: integer("appointment_price_in_cents").notNull(),
  //  1 = Segunda-feira, 2 = Terça-feira, 3 = Quarta-feira, 4 = Quinta-Feira, 5 = Sexta-Feira, 6 = Sábado, 0 = Domingo
  availableFromWeekDay: integer("available_from_week_day").notNull(), // 1
  availableToWeekDay: integer("available_to_week_day").notNull(), // 5      // Trabalha junto ao atributo anterior  ->  "disponível de 1 à 5" (Segunda à Sexta)
  availableFromTime: time("available_from_time").notNull(), // 10      // Este "time" importado do drizzle é um formato do PostgreSQL  ->  HH:MM:SS
  availableToTime: time("available_to_time").notNull(), // 18
  clinicId: uuid("clinic_id") // Foreign Key  ->  Chave estrangeira da clínica que este médico trabalha
    .notNull()
    .references(() => clinicsTable.id, { onDelete: "cascade" }), //  Lembre-se, definimos que 1 médico poderá ter apenas 1 clínica, mas a clínica poderá ter vários médicos, por isso esta referência à tabela "clinicsTable", onde chamamos apenas o "id" da clínica.
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const doctorsTableRelations = relations(
  doctorsTable,
  ({ many, one }) => ({
    clinic: one(clinicsTable, {
      fields: [doctorsTable.clinicId],
      references: [clinicsTable.id],
    }),
    appointments: many(appointmentsTable),
  }),
);

// enum  ->  é uma lista de valores que podem ser escolhidos para um determinado campo.
export const patientSexEnum = pgEnum("patient_sex", ["male", "female"]);

export const patientsTable = pgTable("patients", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(), //  removemos  o  ".unique()"  pois  ele  cria um indíce no banco de dados  ->  A idéia seria não permitir um mesmo e-mail cadastrado 2 vezes!
  phoneNumber: text("phone").notNull(),
  sex: patientSexEnum("sex").notNull(), //  na  hora de criar um novo paciente, será necessário esolher uma das 2 opções que criamos no patientSexEnum !
  clinicId: uuid("clinic_id")
    .notNull()
    .references(() => clinicsTable.id, { onDelete: "cascade" }), //  referência à tabela "clinicsTable", onde chamamos apenas o "id" da clínica. -> Afinal, definimos que teriamos apenas 1 clínica, mas com vários médicos, por isso, criamos a referência!
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const patientsTableRelations = relations(
  patientsTable,
  ({ many, one }) => ({
    clinic: one(clinicsTable, {
      fields: [patientsTable.clinicId],
      references: [clinicsTable.id],
    }),
    appointments: many(appointmentsTable),
  }),
);

// Agora Faremos As Relações entre as tabelas do Banco, Tudo isso nos Agendamentos(Appointments), afinal...
// ...as consultas estão relacionadas a um paciente, um médico e uma clínica -> Interligando-os!

export const appointmentsTable = pgTable("appointments", {
  id: uuid("id").defaultRandom().primaryKey(),
  date: timestamp("date").notNull(),
  patientId: uuid("patient_id") // Foreign Key
    .notNull()
    .references(() => patientsTable.id, { onDelete: "cascade" }),
  doctorId: uuid("doctor_id") // Foreign Key
    .notNull() // Isso tudo é últil para o DB conseguir dar um "Join" na tabela de médicos e trazer aqui
    .references(() => doctorsTable.id, { onDelete: "cascade" }), //  criamos referência à tabela "doctorsTable", onde chamamos apenas o "id", que é o "doctorId" da "doctorsTable".
  clinicId: uuid("clinic_id") // Foreign Key
    .notNull()
    .references(() => clinicsTable.id, { onDelete: "cascade" }), //  criamos referência à tabela "clinicsTable", onde chamamos apenas o "id", que é o "clinicId" da "clinicsTable".
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const appointmentsTableRelations = relations(
  appointmentsTable,
  ({ one }) => ({
    clinic: one(clinicsTable, {
      fields: [appointmentsTable.clinicId],
      references: [clinicsTable.id],
    }),
    doctor: one(doctorsTable, {
      fields: [appointmentsTable.doctorId],
      references: [doctorsTable.id],
    }),
    patient: one(patientsTable, {
      fields: [appointmentsTable.patientId],
      references: [patientsTable.id],
    }),
  }),
);
