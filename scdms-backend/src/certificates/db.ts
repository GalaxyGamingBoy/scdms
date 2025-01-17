import connect from "../airtable";
import { hash } from "../crypto/crypto";

export type CertificateMetadata = {
  id: string;
  fullname: string;
  course: string;
  email: string;
};

export const certExists = async (fullname: string, course: string) => {
  const query = await connect().get("[SCDMS]_Certs", {
    params: {
      maxRecords: 1,
      fields: ["ID"],
      filterByFormula: `AND(Status = 'Active', Fullname = '${hash(
        fullname,
      )}', Course = '${course}')`,
    },
  });

  return query.data.records.length > 0;
};

export const certFetch = async (id: string) => {
  const query = await connect().get("[SCDMS]_Certs", {
    params: {
      maxRecords: 1,
      fields: [
        "ID",
        "Status",
        "Created",
        "DeactivationReason",
        "DaysDeactivated",
      ],
    },
  });

  return query.data.records.length ? query.data.records[0] : null;
};

export const certStatus = async (
  id: string,
  status: string,
  reason?: string,
) => {
  await connect().patch("[SCDMS]_Certs", {
    records: [
      {
        id: id,
        fields: {
          Status: status,
          DaysDeactivated: 0,
          DeactivationReason: reason,
        },
      },
    ],
  });
};

export const certLookup = async (fullname: string) => {
  const query = await connect().get("[SCDMS]_Certs", {
    params: {
      filterByFormula: `Fullname = '${hash(fullname)}'`,
      fields: [
        "ID",
        "Status",
        "Created",
        "DeactivationReason",
        "DaysDeactivated",
        "Course",
      ],
    },
  });

  return query.data.records.map((rec: any) => {
    rec.Fullname = fullname;
    return rec;
  });
};

export const certInsert = async (cert: CertificateMetadata) => {
  await connect()
    .post("[SCDMS]_Certs", {
      records: [
        {
          fields: {
            ID: cert.id,
            Fullname: hash(cert.fullname),
            Course: cert.course,
            Status: "Active",
          },
        },
      ],
    })
    .catch((e) => console.log(JSON.stringify(e)));
};
