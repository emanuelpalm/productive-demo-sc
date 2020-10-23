package sc_demo.sysop.data;

import se.arkalix.dto.DtoReadableAs;

import java.util.List;

import static se.arkalix.dto.DtoEncoding.JSON;

@DtoReadableAs(JSON)
public interface SrMgmtQueryResult {
    int count();

    List<SrMgmtEntry> data();
}